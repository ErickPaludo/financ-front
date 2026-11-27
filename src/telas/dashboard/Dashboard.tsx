import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Alert,
  Box,
  Icon,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart, pieClasses } from "@mui/x-charts/PieChart";
import { ptBRLocaleText } from "@mui/x-charts/locales";

import { AuthContext } from "../../contexts/AuthContext";
import { ContaContext } from "../../contexts/ContaContext";
import { PROPS_ALCA, useOrdemArrastavel } from "../../hooks/useOrdemArrastavel";
import { useOrdemSalva } from "../../hooks/useOrdemSalva";
import { useFlagSalva } from "../../hooks/useFlagSalva";
import { CoresClaro, CoresEscuro } from "../../cores";
import { estiloBotaoSecundario } from "../../estilos";
import {
  TIPO_MOVIMENTACAO,
  type GetMovimentacoes,
  type Movimentacao,
} from "../../models/movimentacoes/GetMovimentacoes";
import TituloPagina from "../../componentes/titulo-pagina/TituloPagina";
import BotaoOcultarValores from "../../componentes/botao-ocultar-valores/BotaoOcultarValores";
import { useBuscaApi } from "../../hooks/useBuscaApi";
import { useCategorias } from "../../hooks/useCategorias";
import { useValoresOcultos } from "../../hooks/useValoresOcultos";
import { emCentavos, exibirMoeda } from "../../utils/formatacao";
import FiltrosConta from "../movimentacoes/filtros/FiltrosConta";
import {
  paraParametros,
  rotaMovimentacoes,
  type FiltrosMovimentacao,
} from "../movimentacoes/filtrosUrl";
import { useFiltrosUrl } from "../movimentacoes/useFiltrosUrl";
import { useSaldosNoPeriodo } from "./useSaldosNoPeriodo";
import {
  agruparCategoriasPorPeriodo,
  agruparPorCategoria,
  agruparPorPeriodo,
  limitesDosPontos,
  semCategoriasIgnoradas,
} from "./agrupamento";
import "../movimentacoes/Movimentacoes.css";

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
    saldo: cores.graficoSaldo,
    sobra: cores.graficoSobra,
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
        <Icon
          aria-hidden
          {...PROPS_ALCA}
          sx={{ fontSize: 20, color: "var(--fnc-tx-apoio)" }}
        >
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
  rotulo = "Formato do gráfico",
}: {
  opcoes: OpcaoFormato<T>[];
  valor: T;
  setValor: (valor: T) => void;
  rotulo?: string;
}) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={valor}
      // clicar no já escolhido devolve null: mantém o atual
      onChange={(_, novo: T | null) => novo && setValor(novo)}
      aria-label={rotulo}
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

// Liga/desliga uma série do "Entradas e saídas" (saldo, sobra); ligado fica na cor da série.
const BotaoSerie: React.FC<{
  rotulo: string;
  dica: string;
  icone: string;
  cor: string;
  ligado: boolean;
  setLigado: (ligado: boolean) => void;
}> = ({ rotulo, dica, icone, cor, ligado, setLigado }) => (
  <Tooltip title={dica}>
    <ToggleButton
      value={rotulo}
      size="small"
      selected={ligado}
      onChange={() => setLigado(!ligado)}
      aria-label={rotulo}
      sx={{
        color: "var(--fnc-tx-apoio)",
        borderColor: "var(--fnc-tx-borda)",
        "&.Mui-selected": { color: cor },
      }}
    >
      <Icon fontSize="small">{icone}</Icon>
    </ToggleButton>
  </Tooltip>
);

const FORMATOS_ENTRADAS_SAIDAS: OpcaoFormato<"linha" | "barra">[] = [
  { valor: "linha", rotulo: "Linhas", icone: "show_chart" },
  { valor: "barra", rotulo: "Barras", icone: "bar_chart" },
];
// quais séries o gráfico "Entradas e saídas" mostra
const SERIES_ENTRADAS_SAIDAS: OpcaoFormato<"ambas" | "entradas" | "saidas">[] =
  [
    { valor: "ambas", rotulo: "Entradas e saídas", icone: "swap_vert" },
    { valor: "entradas", rotulo: "Só entradas", icone: "trending_up" },
    { valor: "saidas", rotulo: "Só saídas", icone: "trending_down" },
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
            // null tira a categoria do tooltip: só as que têm valor naquela data
            valueFormatter: (valor: number | null) =>
              valor ? moeda(valor) : null,
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
            [`& .${pieClasses.arcLabel}`]: { fill: "white", fontWeight: 600 },
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
  const { ocultos, alternarOcultos } = useValoresOcultos();
  const [formato, setFormato] = useState<"linha" | "barra">("linha");
  const [serieVisivel, setSerieVisivel] = useState<
    "ambas" | "entradas" | "saidas"
  >("ambas");
  const { user } = useContext(AuthContext);

  const { filtros, alterarFiltros: alterarFiltrosUrl } = useFiltrosUrl();
  // filtro de categorias lembrado por conta (pedido do usuário): salvo a cada mudança e,
  // ao abrir sem categorias na URL, aplicado uma vez
  const chaveCategorias = `dashboardCategorias:${contaAtual.idConta}`;
  const alterarFiltros = (mudanca: Partial<FiltrosMovimentacao>) => {
    if (mudanca.categorias) {
      try {
        localStorage.setItem(chaveCategorias, JSON.stringify(mudanca.categorias));
      } catch {
        // sem persistência: vale só até sair do dashboard
      }
    }
    alterarFiltrosUrl(mudanca);
  };
  const restaurouCategorias = useRef("");
  useEffect(() => {
    if (restaurouCategorias.current === chaveCategorias) return;
    restaurouCategorias.current = chaveCategorias;
    if (filtros.categorias.length) return; // a URL manda (link com filtros)
    let salvas: unknown = [];
    try {
      salvas = JSON.parse(localStorage.getItem(chaveCategorias) ?? "[]");
    } catch {
      return;
    }
    if (Array.isArray(salvas) && salvas.length && salvas.every(Number.isInteger))
      alterarFiltrosUrl({ categorias: salvas });
  }, [chaveCategorias, filtros.categorias.length, alterarFiltrosUrl]);
  const { inicio, fim, tipo } = filtros;
  const { categorias, buscarCategorias } = useCategorias(contaAtual.idConta);
  // categorias ignoradas nos gráficos, lembradas por conta (lista de ids no localStorage)
  const { ids: ignoradas, salvarOrdem: salvarIgnoradas } =
    useOrdemSalva<number>(`dashboardIgnoradas:${contaAtual.idConta}`);
  // atalhos na barra: toda categoria já ignorada fica lá até o X, mesmo desmarcada (pedido do usuário)
  const { ids: atalhosIgnoradas, salvarOrdem: salvarAtalhos } =
    useOrdemSalva<number>(`dashboardAtalhosIgnoradas:${contaAtual.idConta}`);
  const ignorar = (ids: number[]) => {
    salvarIgnoradas(ids);
    // inclui as ignoradas de agora: as salvas antes dos atalhos não estavam na lista e sumiam ao desmarcar
    salvarAtalhos([...new Set([...atalhosIgnoradas, ...ignoradas, ...ids])]);
  };
  // com o filtro de tipo, só a pizza e a linha daquele tipo aparecem
  const mostraEntradas = tipo !== "saida";
  const mostraSaidas = tipo !== "entrada";

  const { dados, erro, carregando, buscar } = useBuscaApi<GetMovimentacoes>(
    rotaMovimentacoes(contaAtual.idConta, filtros),
    "Não foi possível carregar as movimentações.",
  );
  // o que a API devolve (mesma rota da tabela da tela da conta), sem as categorias ignoradas
  const movimentacoes = useMemo(
    () =>
      semCategoriasIgnoradas(dados?.conteudo.movimentacaos ?? [], ignoradas),
    [dados, ignoradas],
  );
  // as que "Ignorar categorias" tirou inteiras (regra do dashboard: ficaram sem nenhuma categoria)
  const escondidas = useMemo(
    () =>
      (dados?.conteudo.movimentacaos ?? []).filter(
        (mov) =>
          mov.categorias.length > 0 &&
          mov.categorias.every((c) => ignoradas.includes(c.idCategoria)),
      ),
    [dados, ignoradas],
  );
  // saldo da conta ao fim de cada ponto: com períodos por mês faz uma requisição por mês,
  // por isso só com a opção ligada no card (pedido do usuário)
  const [mostrarSaldo, setMostrarSaldo] = useFlagSalva("dashboardSaldo");
  // sobra (entradas − saídas de cada ponto): também começa desligada (pedido do usuário)
  const [mostrarSobra, setMostrarSobra] = useFlagSalva("dashboardSobra");
  // botão Recarregar: busca de novo movimentações, categorias e o saldo de cada mês
  const [recargas, setRecargas] = useState(0);
  const recarregar = () => {
    buscar();
    buscarCategorias();
    setRecargas((n) => n + 1);
  };
  const saldo = useSaldosNoPeriodo(
    contaAtual.idConta,
    filtros,
    mostrarSaldo,
    dados,
    escondidas,
    recargas,
  );

  const pontos = useMemo(() => {
    const agrupados = agruparPorPeriodo(movimentacoes, inicio, fim);
    // início e fim de cada dia ou mês: o duplo clique abre a tela da conta nesse período
    const { porMes, pontos: limites } = limitesDosPontos(inicio, fim);
    const resultado = [];
    let acumulada = 0;
    for (let i = 0; i < agrupados.length; i++) {
      const ponto = agrupados[i];
      // por dia, acumula desde o início do período; por mês, só o do mês (pedidos do usuário)
      const doPonto = ponto.entradas - ponto.saidas;
      acumulada = emCentavos(porMes ? doPonto : acumulada + doPonto);
      resultado.push({
        ...ponto,
        sobra: acumulada,
        saldo: saldo.saldos?.[i] ?? null,
        inicioPonto: limites[i]?.inicio ?? inicio,
        fimPonto: limites[i]?.fim ?? fim,
      });
    }
    return resultado;
  }, [movimentacoes, inicio, fim, saldo.saldos]);
  const total = (chave: "entradas" | "saidas") =>
    pontos.reduce((soma, p) => soma + p[chave], 0);
  const sobra = total("entradas") - total("saidas");
  // no card "Entradas e saídas": o filtro de tipo manda; com Tipo = Todas, vale o seletor do card
  const ambosTipos = mostraEntradas && mostraSaidas;
  const linhaEntradas = mostraEntradas && serieVisivel !== "saidas";
  const linhaSaidas = mostraSaidas && serieVisivel !== "entradas";
  // a sobra só faz sentido com entradas e saídas no gráfico
  const sobraDisponivel = linhaEntradas && linhaSaidas;
  // só os dias (ou meses) com movimentação nas séries visíveis; os totais continuam com todos
  const [soComMovimento, setSoComMovimento] = useFlagSalva(
    "dashboardSoComMovimento",
  );
  const pontosGrafico = soComMovimento
    ? pontos.filter(
        (p) => (linhaEntradas && p.entradas) || (linhaSaidas && p.saidas),
      )
    : pontos;

  // com muitos pontos (período longo por dia) os marcadores viram ruído: só a linha
  const marcarPontos = pontosGrafico.length <= 31;
  const moeda = (valor: number | null) => exibirMoeda(valor ?? 0, ocultos);
  const marcaEixo = (valor: number) =>
    ocultos ? "••••" : moedaCompacta.format(valor);

  const cores = useCoresGrafico();
  // o mesmo gráfico em linhas ou barras: só o eixo X e os marcadores mudam (sobra e saldo também)
  const series = [
    linhaEntradas && {
      dataKey: "entradas",
      label: "Entradas",
      color: cores.entrada,
      valueFormatter: moeda,
    },
    linhaSaidas && {
      dataKey: "saidas",
      label: "Saídas",
      color: cores.saida,
      valueFormatter: moeda,
    },
    sobraDisponivel &&
      mostrarSobra && {
        dataKey: "sobra",
        label: "Sobra",
        color: cores.sobra,
        valueFormatter: moeda,
      },
    // saldo no mesmo eixo das entradas e saídas: com um eixo próprio à direita, o ponto do saldo
    // ficava na altura de outro valor do eixo da esquerda e enganava (relato do usuário)
    mostrarSaldo && {
      dataKey: "saldo",
      label: "Saldo da conta",
      color: cores.saldo,
      valueFormatter: (valor: number | null) =>
        valor === null ? null : moeda(valor),
    },
  ].filter((serie) => serie !== false);
  const eixoValores = {
    position: "left" as const,
    valueFormatter: marcaEixo,
    width: 72,
  };
  // Duplo clique num dia (ou mês) abre numa nova aba a tela da conta naquele período, com os
  // outros filtros da URL (pedido do usuário). O gráfico só avisa o clique: dois no mesmo ponto
  // em até 400 ms contam como duplo.
  const ultimoClique = useRef({ indice: -1, quando: 0 });
  const aoClicarNoEixo = (_: unknown, dados: { dataIndex: number } | null) => {
    if (!dados) return;
    const agora = Date.now();
    const duplo =
      ultimoClique.current.indice === dados.dataIndex &&
      agora - ultimoClique.current.quando < 400;
    ultimoClique.current = { indice: dados.dataIndex, quando: duplo ? 0 : agora };
    const ponto = pontosGrafico[dados.dataIndex];
    if (!duplo || !ponto) return;
    const parametros = paraParametros({
      ...filtros,
      inicio: ponto.inicioPonto,
      fim: ponto.fimPonto,
    });
    window.open(
      `/${contaAtual.idConta}/contabancaria?${parametros}`,
      "_blank",
      "noopener",
    );
  };

  const propsGrafico = {
    onAxisClick: aoClicarNoEixo,
    height: 260,
    loading: carregando || saldo.carregando,
    localeText: ptBRLocaleText,
    dataset: pontosGrafico,
    yAxis: [eixoValores],
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
                {[
                  linhaEntradas && `Entradas ${moeda(total("entradas"))}`,
                  linhaSaidas && `Saídas ${moeda(total("saidas"))}`,
                  // o que sobrou: só faz sentido com os dois tipos no filtro
                  ambosTipos &&
                    `${sobra < 0 ? "Faltou" : "Sobrou"} ${moeda(Math.abs(sobra))}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Typography>
              {ambosTipos && (
                <SeletorFormato
                  opcoes={SERIES_ENTRADAS_SAIDAS}
                  valor={serieVisivel}
                  setValor={setSerieVisivel}
                  rotulo="Séries do gráfico"
                />
              )}
              <SeletorFormato
                opcoes={FORMATOS_ENTRADAS_SAIDAS}
                valor={formato}
                setValor={setFormato}
              />
              {sobraDisponivel && (
                <BotaoSerie
                  rotulo="Mostrar sobra"
                  dica="Sobra: por dia, entradas menos saídas desde o início do período; por mês, só as do mês"
                  icone="savings"
                  cor={cores.sobra}
                  ligado={mostrarSobra}
                  setLigado={setMostrarSobra}
                />
              )}
              <BotaoSerie
                rotulo="Só dias com movimentação"
                dica="Mostrar só os dias (ou meses) que tiveram movimentação"
                icone="event_available"
                cor="primary.main"
                ligado={soComMovimento}
                setLigado={setSoComMovimento}
              />
              <BotaoSerie
                rotulo="Mostrar saldo da conta"
                dica="Saldo da conta em cada data (faz mais consultas em períodos longos)"
                icone="account_balance"
                cor={cores.saldo}
                ligado={mostrarSaldo}
                setLigado={setMostrarSaldo}
              />
            </Stack>
          }
        >
          {saldo.erro && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {saldo.erro}
            </Alert>
          )}
          {/* entradas e saídas num eixo só, à esquerda: mesma escala, comparáveis pela altura */}
          {formato === "linha" ? (
            <LineChart
              {...propsGrafico}
              xAxis={[{ scaleType: "point", dataKey: "rotulo" }]}
              series={series.map((serie) => ({
                ...serie,
                showMark: marcarPontos,
                connectNulls: true, // saldo de mês sem resposta: liga os vizinhos
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
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", gap: 2 }}
      >
        <TituloPagina
          titulo={`Dashboard · ${contaAtual.titulo}`}
          subtitulo="Resumo do período"
        />
        <Stack direction="row" sx={{ gap: 1 }}>
          <Tooltip title="Recarregar">
            <span>
              <IconButton
                aria-label="Recarregar"
                disabled={carregando || saldo.carregando}
                onClick={recarregar}
                sx={{ ...estiloBotaoSecundario, width: 44 }}
              >
                <Icon>refresh</Icon>
              </IconButton>
            </span>
          </Tooltip>
          <BotaoOcultarValores ocultos={ocultos} onAlternar={alternarOcultos} />
        </Stack>
      </Stack>

      <Stack
        direction="row"
        sx={{ flexWrap: "wrap", alignItems: "flex-end", gap: 1.5 }}
      >
        <FiltrosConta
          categorias={categorias}
          filtros={filtros}
          alterarFiltros={alterarFiltros}
          ignoradas={ignoradas}
          setIgnoradas={ignorar}
          atalhosIgnoradas={atalhosIgnoradas}
          setAtalhosIgnoradas={salvarAtalhos}
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
