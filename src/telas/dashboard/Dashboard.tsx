import { useContext, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
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

import { ContaContext } from "../../contexts/ContaContext";
import { CoresClaro, CoresEscuro } from "../../cores";
import {
  TIPO_MOVIMENTACAO,
  type Categoria,
  type GetMovimentacoes,
  type Movimentacao,
} from "../../models/movimentacoes/GetMovimentacoes";
import TituloPagina from "../../componentes/titulo-pagina/TituloPagina";
import { useBuscaApi } from "../../hooks/useBuscaApi";
import { useCategorias } from "../../hooks/useCategorias";
import CheckBoxList from "../../props/check-box-list/CheckBoxList";
import { ChipFiltro } from "../movimentacoes/filtros/ChipFiltro";
import { useValoresOcultos } from "../../hooks/useValoresOcultos";
import { exibirMoeda, paraUtcSemFuso } from "../../utils/formatacao";
import FiltroPeriodo from "../movimentacoes/filtro-periodo/FiltroPeriodo";
import { lerFiltros, paraParametros } from "../movimentacoes/filtrosUrl";
import { agruparPorCategoria, agruparPorPeriodo } from "./agrupamento";
import "../movimentacoes/MovimentacaoesStyle.css";

const SEM_CATEGORIA: Categoria = {
  idCategoria: 0,
  nome: "Sem categoria",
  cor: "",
};

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
  largura?: "inteira"; // ocupa a linha toda da grade
  children: ReactNode;
};

// Card de vidro fosco (o mesmo da tabela de transações) com título e resumo no topo.
const CardGrafico: React.FC<PropCardGrafico> = ({
  id,
  titulo,
  resumo,
  largura,
  children,
}) => (
  <Box
    component="section"
    aria-labelledby={id}
    sx={{
      p: { xs: 2, md: 3 },
      minWidth: 0, // dentro da grade: deixa o gráfico encolher
      gridColumn: largura === "inteira" ? "1 / -1" : undefined,
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
      <Typography id={id} component="h2" sx={{ fontSize: 16, fontWeight: 600 }}>
        {titulo}
      </Typography>
      {resumo}
    </Stack>
    {children}
  </Box>
);

const textoResumo = { fontSize: 13, color: "var(--fnc-tx-apoio)" };

type PropPizzaCategorias = {
  id: string;
  titulo: string;
  movimentacoes: Movimentacao[];
  tipo: number; // TIPO_MOVIMENTACAO
  carregando: boolean;
  moeda: (valor: number) => string;
};

// Rosca com o total do tipo por categoria, cada fatia na cor da categoria (a mesma dos chips).
// O percentual só nas fatias grandes o bastante; o valor exato no tooltip.
const PizzaCategorias: React.FC<PropPizzaCategorias> = ({
  id,
  titulo,
  movimentacoes,
  tipo,
  carregando,
  moeda,
}) => {
  const { semCategoria } = useCoresGrafico();
  const fatias = useMemo(
    () => agruparPorCategoria(movimentacoes, tipo, semCategoria),
    [movimentacoes, tipo, semCategoria],
  );
  const total = fatias.reduce((soma, f) => soma + f.value, 0);
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
      resumo={<Typography sx={textoResumo}>Total {moeda(total)}</Typography>}
    >
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

  const [parametrosUrl, setParametrosUrl] = useSearchParams();
  const filtros = useMemo(() => lerFiltros(parametrosUrl), [parametrosUrl]);
  const { inicio, fim, categorias: categoriasSelecionadas } = filtros;
  const { categorias } = useCategorias(contaAtual.idConta);
  const alterarFiltros = (mudanca: Partial<typeof filtros>) =>
    setParametrosUrl(paraParametros({ ...filtros, ...mudanca }), {
      replace: true,
    });

  const parametros = new URLSearchParams({
    DthrMovimentacaoInicial: paraUtcSemFuso(inicio),
    DthrMovimentacaoFinal: paraUtcSemFuso(fim),
    RetornaFixos: "true", // agendadas do período entram, como na tabela
  });
  categoriasSelecionadas.forEach((id) =>
    parametros.append("IdCategoria", String(id)),
  );
  const { dados, erro, carregando } = useBuscaApi<GetMovimentacoes>(
    `/Contas/${contaAtual.idConta}/Movimentacoes/Retornar?${parametros}`,
    "Não foi possível carregar as movimentações.",
  );
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
    {
      dataKey: "entradas",
      label: "Entradas",
      color: cores.entrada,
      valueFormatter: moeda,
    },
    {
      dataKey: "saidas",
      label: "Saídas",
      color: cores.saida,
      valueFormatter: moeda,
    },
  ];
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
        <Box sx={{ flex: "1 1 360px", maxWidth: 520 }}>
          <FiltroPeriodo
            dataInicial={inicio}
            dataFinal={fim}
            setPeriodo={(novoInicio, novoFim) =>
              alterarFiltros({ inicio: novoInicio, fim: novoFim })
            }
          />
        </Box>
        <CheckBoxList<Categoria>
          itens={[SEM_CATEGORIA, ...categorias]}
          chaveId="idCategoria"
          chaveTexto="nome"
          selecionados={categoriasSelecionadas}
          setSelecionados={(categorias) => alterarFiltros({ categorias })}
          rotulo="Categorias"
          ignorarPrimeiroItem
          gatilho={({ abrir, aberto, resumo }) => (
            <ChipFiltro
              texto={resumo ? `Categorias: ${resumo}` : "Categorias"}
              aberto={aberto}
              onClick={abrir}
              onLimpar={
                categoriasSelecionadas.length > 0
                  ? () => alterarFiltros({ categorias: [] })
                  : undefined
              }
            />
          )}
        />
      </Stack>

      {erro && <Alert severity="error">{erro}</Alert>}

      {/* as duas pizzas em cima, lado a lado (no celular, uma por linha); embaixo, a linha na largura toda */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
        }}
      >
        <PizzaCategorias
          id="titulo-pizza-saidas"
          titulo="Saídas por categoria"
          movimentacoes={movimentacoes}
          tipo={TIPO_MOVIMENTACAO.Despesa}
          carregando={carregando}
          moeda={moeda}
        />
        <PizzaCategorias
          id="titulo-pizza-entradas"
          titulo="Entradas por categoria"
          movimentacoes={movimentacoes}
          tipo={TIPO_MOVIMENTACAO.Receita}
          carregando={carregando}
          moeda={moeda}
        />

        <CardGrafico
          id="titulo-entradas-saidas"
          largura="inteira"
          titulo="Entradas e saídas"
          resumo={
            <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
              <Typography sx={textoResumo}>
                Entradas {moeda(total("entradas"))} · Saídas{" "}
                {moeda(total("saidas"))}
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={formato}
                // clicar no já escolhido devolve null: mantém o atual
                onChange={(_, novo: "linha" | "barra" | null) =>
                  novo && setFormato(novo)
                }
                aria-label="Formato do gráfico"
                sx={{
                  "& .MuiToggleButton-root": {
                    color: "var(--fnc-tx-apoio)",
                    borderColor: "var(--fnc-tx-borda)",
                  },
                  "& .Mui-selected": { color: "var(--fnc-tx-texto)" },
                }}
              >
                <Tooltip title="Linhas">
                  <ToggleButton value="linha" aria-label="Linhas">
                    <Icon fontSize="small">show_chart</Icon>
                  </ToggleButton>
                </Tooltip>
                <Tooltip title="Barras">
                  <ToggleButton value="barra" aria-label="Barras">
                    <Icon fontSize="small">bar_chart</Icon>
                  </ToggleButton>
                </Tooltip>
              </ToggleButtonGroup>
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
      </Box>
    </Stack>
  );
};

export default Dashboard;
