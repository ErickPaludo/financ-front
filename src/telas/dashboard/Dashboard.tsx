import { useContext, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Icon,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { ptBRLocaleText } from "@mui/x-charts/locales";

import { AuthContext } from "../../contexts/AuthContext";
import { ContaContext } from "../../contexts/ContaContext";
import { useOrdemArrastavel } from "../../hooks/useOrdemArrastavel";
import { CoresClaro, CoresEscuro } from "../../cores";
import {
  TIPO_MOVIMENTACAO,
  type GetMovimentacoes,
  type Movimentacao,
} from "../../models/movimentacoes/GetMovimentacoes";
import TituloPagina from "../../componentes/titulo-pagina/TituloPagina";
import { useBuscaApi } from "../../hooks/useBuscaApi";
import { useCategorias } from "../../hooks/useCategorias";
import { useValoresOcultos } from "../../hooks/useValoresOcultos";
import { exibirMoeda } from "../../utils/formatacao";
import FiltrosConta from "../movimentacoes/filtros/FiltrosConta";
import { rotaMovimentacoes } from "../movimentacoes/filtrosUrl";
import { useFiltrosUrl } from "../movimentacoes/useFiltrosUrl";
import {
  agruparCategoriasPorPeriodo,
  agruparPorCategoria,
  agruparPorPeriodo,
} from "./agrupamento";
import "../movimentacoes/MovimentacaoesStyle.css";

// marcas do eixo curtas ("R$ 1,2 mil"): o valor exato fica no tooltip
const moedaCompacta = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

// Cores das séries em hex, não var(--fnc-tx-*): o tooltip fica no body, fora do <main> que
// define as variáveis, e lá a var vazia virava um quadrado preto. O tema da página diz o modo.
function useCoresGrafico() {
  const claro = useTheme().palette.mode === "light";
  const cores = (claro ? CoresClaro : CoresEscuro).transacoes;
  return {
    entrada: cores.graficoEntrada,
    saida: cores.graficoSaida,
    semCategoria: { nome: "Sem categoria", cor: cores.apoio },
  };
}

// eixos, grade e legenda discretos, no tom de apoio da tela
const ESTILO_GRAFICO = {
  "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
    stroke: "var(--fnc-tx-borda)",
  },
  "& .MuiChartsAxis-tickLabel, & .MuiChartsAxis-label": {
    fill: "var(--fnc-tx-apoio)",
  },
  "& .MuiChartsGrid-line": {
    stroke: "var(--fnc-tx-borda)",
    strokeOpacity: 0.5,
  },
};

// O tooltip usa position: fixed e, por padrão, fica dentro do card; o backdrop-filter do card
// (e do <main>) vira a referência do "fixed" e o valor aparecia longe do mouse. No body, não.
const TOOLTIP_NO_BODY = { tooltip: { container: document.body } };

type PropCardGrafico = {
  id: string;
  titulo: string;
  resumo: ReactNode; // à direita do título (totais)
  children: ReactNode;
};

// Card de vidro fosco (o mesmo da tabela de transações) com título e resumo no topo.
const CardGrafico: React.FC<PropCardGrafico> = ({
  id,
  titulo,
  resumo,
  children,
}) => (
  <Box
    component="section"
    aria-labelledby={id}
    sx={{
      p: { xs: 2, md: 3 },
      bgcolor: "color-mix(in srgb, var(--fnc-tx-superficie) 55%, transparent)",
      backdropFilter: "blur(16px) saturate(140%)",
      border: "1px solid var(--fnc-tx-borda)",
      borderRadius: "16px",
      color: "var(--fnc-tx-texto)",
    }}
  >
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1,
        mb: 1,
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: "center", gap: 0.5, cursor: "grab" }}
      >
        {/* só indica que o card arrasta (o card inteiro é arrastável) */}
        <Icon aria-hidden sx={{ fontSize: 20, color: "var(--fnc-tx-apoio)" }}>
          drag_indicator
        </Icon>
        <Typography
          id={id}
          component="h2"
          sx={{ fontSize: 16, fontWeight: 600 }}
        >
          {titulo}
        </Typography>
      </Stack>
      {resumo}
    </Stack>
    {children}
  </Box>
);

type IdGrafico = "saidas" | "entradas" | "entradas-saidas";

const textoResumo = { fontSize: 13, color: "var(--fnc-tx-apoio)" };

type OpcaoFormato<T extends string> = {
  valor: T;
  rotulo: string;
  icone: string;
};

// Botões de ícone que trocam o tipo de gráfico de um card (linhas/barras, pizza/linhas).
function SeletorFormato<T extends string>({
  opcoes,
  valor,
  setValor,
}: {
  opcoes: OpcaoFormato<T>[];
  valor: T;
  setValor: (valor: T) => void;
}) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={valor}
      // clicar no já escolhido devolve null: mantém o atual
      onChange={(_, novo: T | null) => novo && setValor(novo)}
      aria-label="Formato do gráfico"
      sx={{
        "& .MuiToggleButton-root": {
          color: "var(--fnc-tx-apoio)",
          borderColor: "var(--fnc-tx-borda)",
        },
        "& .Mui-selected": { color: "var(--fnc-tx-texto)" },
      }}
    >
      {opcoes.map((opcao) => (
        <Tooltip key={opcao.valor} title={opcao.rotulo}>
          <ToggleButton value={opcao.valor} aria-label={opcao.rotulo}>
            <Icon fontSize="small">{opcao.icone}</Icon>
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
}

const FORMATOS_ENTRADAS_SAIDAS: OpcaoFormato<"linha" | "barra">[] = [
  { valor: "linha", rotulo: "Linhas", icone: "show_chart" },
  { valor: "barra", rotulo: "Barras", icone: "bar_chart" },
];
const FORMATOS_CATEGORIAS: OpcaoFormato<"pizza" | "linha">[] = [
  { valor: "pizza", rotulo: "Pizza", icone: "donut_large" },
  { valor: "linha", rotulo: "Linhas no período", icone: "show_chart" },
];

type PropPizzaCategorias = {
  id: string;
  titulo: string;
  movimentacoes: Movimentacao[];
  tipo: number; // TIPO_MOVIMENTACAO
  inicio: string; // período, para o eixo do modo linhas
  fim: string;
  carregando: boolean;
  moeda: (valor: number) => string;
  marcaEixo: (valor: number) => string;
};

// Rosca com o total do tipo por categoria, cada fatia na cor da categoria (a mesma dos chips).
// O percentual só nas fatias grandes o bastante; o valor exato no tooltip. No modo "linhas",
// as mesmas categorias viram uma linha cada ao longo do período.
const PizzaCategorias: React.FC<PropPizzaCategorias> = ({
  id,
  titulo,
  movimentacoes,
  tipo,
  inicio,
  fim,
  carregando,
  moeda,
  marcaEixo,
}) => {
  const [formato, setFormato] = useState<"pizza" | "linha">("pizza");
  const { semCategoria } = useCoresGrafico();
  const noTempo = useMemo(
    () =>
      agruparCategoriasPorPeriodo(
        movimentacoes,
        tipo,
        semCategoria,
        inicio,
        fim,
      ),
    [movimentacoes, tipo, semCategoria, inicio, fim],
  );
  const fatias = useMemo(
    () => agruparPorCategoria(movimentacoes, tipo, semCategoria),
    [movimentacoes, tipo, semCategoria],
  );
  // total real do tipo, não a soma das fatias (que repete quem tem várias categorias);
  // a % da fatia é a parte do total que tem aquela categoria
  const total = movimentacoes
    .filter((m) => m.tipo === tipo)
    .reduce((soma, m) => soma + m.valor, 0);
  const percentual = (valor: number) => `${Math.round((valor / total) * 100)}%`;
  // a legenda (e o tooltip) mostram a porcentagem ao lado do nome: "Mercado 42%";
  // fatia que arredonda para 0% some (o total do topo continua com ela)
  const comPercentual = fatias
    .filter((f) => percentual(f.value) !== "0%")
    .map((f) => ({
      ...f,
      label: `${f.label} ${percentual(f.value)}`,
    }));

  return (
    <CardGrafico
      id={id}
      titulo={titulo}
      resumo={
        <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
          <Typography sx={textoResumo}>Total {moeda(total)}</Typography>
          <SeletorFormato
            opcoes={FORMATOS_CATEGORIAS}
            valor={formato}
            setValor={setFormato}
          />
        </Stack>
      }
    >
      {formato === "linha" ? (
        <LineChart
          height={240}
          loading={carregando}
          localeText={ptBRLocaleText}
          dataset={noTempo.pontos}
          xAxis={[{ scaleType: "point", dataKey: "rotulo" }]}
          yAxis={[{ position: "left", valueFormatter: marcaEixo, width: 72 }]}
          series={noTempo.categorias.map((c) => ({
            dataKey: `c${c.id}`,
            label: c.label,
            color: c.color,
            valueFormatter: (valor: number | null) => moeda(valor ?? 0),
            showMark: noTempo.pontos.length <= 31,
          }))}
          grid={{ horizontal: true }}
          slotProps={TOOLTIP_NO_BODY}
          sx={ESTILO_GRAFICO}
        />
      ) : (
        <PieChart
          height={240}
          loading={carregando}
          localeText={ptBRLocaleText}
          series={[
            {
              data: comPercentual,
              innerRadius: "55%",
              paddingAngle: 1,
              cornerRadius: 4,
              valueFormatter: (item) => moeda(item.value),
              arcLabel: (item) => percentual(item.value),
              arcLabelMinAngle: 25,
              highlightScope: { fade: "global", highlight: "item" },
            },
          ]}
          slotProps={{
            ...TOOLTIP_NO_BODY,
            legend: {
              direction: "horizontal",
              position: { vertical: "bottom", horizontal: "center" },
            },
          }}
          sx={{
            ...ESTILO_GRAFICO,
            "& .MuiPieArcLabel-root": { fill: "white", fontWeight: 600 },
          }}
        />
      )}
    </CardGrafico>
  );
};

// Dashboard da conta: gráficos do período (o mesmo ?inicio=&fim= da tela de transações).
const Dashboard: React.FC = () => {
  const { conta } = useContext(ContaContext);
  // a rota (ContaDaRota) só mostra esta tela com a conta carregada
  const contaAtual = conta!;
  const { ocultos } = useValoresOcultos();
  const [formato, setFormato] = useState<"linha" | "barra">("linha");
  const { user } = useContext(AuthContext);

  const { filtros, alterarFiltros } = useFiltrosUrl();
  const { inicio, fim, tipo } = filtros;
  const { categorias } = useCategorias(contaAtual.idConta);
  // com o filtro de tipo, só a pizza e a linha daquele tipo aparecem
  const mostraEntradas = tipo !== "saida";
  const mostraSaidas = tipo !== "entrada";

  const { dados, erro, carregando } = useBuscaApi<GetMovimentacoes>(
    rotaMovimentacoes(contaAtual.idConta, filtros),
    "Não foi possível carregar as movimentações.",
  );
  // exatamente o que a API devolve, como a tabela da tela da conta (mesma rota, sem filtro extra)
  const movimentacoes = useMemo(
    () => dados?.conteudo.movimentacaos ?? [],
    [dados],
  );

  const pontos = useMemo(
    () => agruparPorPeriodo(movimentacoes, inicio, fim),
    [movimentacoes, inicio, fim],
  );
  const total = (chave: "entradas" | "saidas") =>
    pontos.reduce((soma, p) => soma + p[chave], 0);

  // com muitos pontos (período longo por dia) os marcadores viram ruído: só a linha
  const marcarPontos = pontos.length <= 31;
  const moeda = (valor: number | null) => exibirMoeda(valor ?? 0, ocultos);
  const marcaEixo = (valor: number) =>
    ocultos ? "••••" : moedaCompacta.format(valor);

  const cores = useCoresGrafico();
  // o mesmo gráfico em linhas ou barras: só o eixo X e os marcadores mudam
  const series = [
    mostraEntradas && {
      dataKey: "entradas",
      label: "Entradas",
      color: cores.entrada,
      valueFormatter: moeda,
    },
    mostraSaidas && {
      dataKey: "saidas",
      label: "Saídas",
      color: cores.saida,
      valueFormatter: moeda,
    },
  ].filter((serie) => serie !== false);
  const propsGrafico = {
    height: 260,
    loading: carregando,
    localeText: ptBRLocaleText,
    dataset: pontos,
    yAxis: [
      { position: "left" as const, valueFormatter: marcaEixo, width: 72 },
    ],
    grid: { horizontal: true },
    slotProps: TOOLTIP_NO_BODY,
    sx: ESTILO_GRAFICO,
  };

  // Gráficos na ordem que o usuário escolheu arrastando (salva por usuário). Com o filtro de
  // tipo, os escondidos mantêm o lugar: a troca de posição é feita na lista completa.
  const graficos: { id: IdGrafico; visivel: boolean; elemento: ReactNode }[] = [
    {
      id: "saidas",
      visivel: mostraSaidas,
      elemento: (
        <PizzaCategorias
          id="titulo-pizza-saidas"
          titulo="Saídas por categoria"
          movimentacoes={movimentacoes}
          tipo={TIPO_MOVIMENTACAO.Despesa}
          inicio={inicio}
          fim={fim}
          carregando={carregando}
          moeda={moeda}
          marcaEixo={marcaEixo}
        />
      ),
    },
    {
      id: "entradas",
      visivel: mostraEntradas,
      elemento: (
        <PizzaCategorias
          id="titulo-pizza-entradas"
          titulo="Entradas por categoria"
          movimentacoes={movimentacoes}
          tipo={TIPO_MOVIMENTACAO.Receita}
          inicio={inicio}
          fim={fim}
          carregando={carregando}
          moeda={moeda}
          marcaEixo={marcaEixo}
        />
      ),
    },
    {
      id: "entradas-saidas",
      visivel: true,
      elemento: (
        <CardGrafico
          id="titulo-entradas-saidas"
          titulo="Entradas e saídas"
          resumo={
            <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
              <Typography sx={textoResumo}>
                Entradas {moeda(total("entradas"))} · Saídas{" "}
                {moeda(total("saidas"))}
              </Typography>
              <SeletorFormato
                opcoes={FORMATOS_ENTRADAS_SAIDAS}
                valor={formato}
                setValor={setFormato}
              />
            </Stack>
          }
        >
          {/* um eixo só, à esquerda: entradas e saídas na mesma escala, comparáveis pela altura */}
          {formato === "linha" ? (
            <LineChart
              {...propsGrafico}
              xAxis={[{ scaleType: "point", dataKey: "rotulo" }]}
              series={series.map((serie) => ({
                ...serie,
                showMark: marcarPontos,
              }))}
            />
          ) : (
            <BarChart
              {...propsGrafico}
              xAxis={[{ scaleType: "band", dataKey: "rotulo" }]}
              series={series}
              borderRadius={4}
            />
          )}
        </CardGrafico>
      ),
    },
  ];
  const { ordenados, arrastando, propsArrastar } = useOrdemArrastavel(
    `ordemDashboard:${user?.id ?? "anonimo"}`,
    graficos,
    (g) => g.id,
  );
  const graficosVisiveis = ordenados.filter((g) => g.visivel);

  return (
    <Stack className="transacoes-container" spacing={3}>
      <TituloPagina
        titulo={`Dashboard · ${contaAtual.titulo}`}
        subtitulo="Resumo do período"
      />

      <Stack
        direction="row"
        sx={{ flexWrap: "wrap", alignItems: "flex-end", gap: 1.5 }}
      >
        <FiltrosConta
          categorias={categorias}
          filtros={filtros}
          alterarFiltros={alterarFiltros}
        />
      </Stack>

      {erro && <Alert severity="error">{erro}</Alert>}

      {/* um gráfico por linha, na largura toda; arraste um card para mudar a ordem */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)", // o gráfico encolhe com a tela, sem estourar
          gap: 3,
        }}
      >
        {graficosVisiveis.map(({ id, elemento }) => (
          <Box
            key={id}
            {...propsArrastar(id)}
            sx={{
              opacity: arrastando === id ? 0.4 : 1,
              transition: "opacity 0.15s ease",
            }}
          >
            {elemento}
          </Box>
        ))}
      </Box>
    </Stack>
  );
};

export default Dashboard;
