// Paletas do app. Fonte única das cores: o tema do MUI (tema.ts) e os componentes leem daqui.
import type { CSSProperties } from "react";

export type Paleta = {
  primaria: { principal: string };
  secundaria: { principal: string }; // labels, subtítulos e ícones
  fundo: {
    pagina: string;
    superficie: string;
    campo: string;
  };
  borda: string;
  texto: string;
  barraLateral: CoresBarraLateral;
  login: CoresLogin;
  telas: CoresTelas;
  transacoes: CoresTransacoes;
};

// Componentes antigos (CSS próprio) das telas logadas: viram variáveis --fnc-<chave> (variaveisTelas).
// "texto"/"apoio" são para o que fica direto sobre o fundo da página; cards, tabelas e listas
// trocam por "textoSuperficie"/"apoioSuperficie" redefinindo as duas variáveis no próprio CSS.
export type CoresTelas = Record<
  | "pagina" // fundo da área central
  | "texto"
  | "apoio"
  | "textoSuperficie"
  | "apoioSuperficie"
  | "superficie"
  | "cabecalho" // cabeçalho das tabelas
  | "bordaSuave"
  | "apagado"
  | "linhaHover",
  string
>;

// Barra lateral das telas logadas. Tem cores próprias porque fica escura nos dois modos.
export type CoresBarraLateral = {
  fundo: string;
  rodape: string; // área do usuário, um tom abaixo do fundo
  contorno: string; // borda direita (no celular, borda de baixo da barra superior)
  divisoria: string; // linha acima do rodapé e contorno da logo
  item: string; // texto e ícone dos itens do menu
  itemHover: string;
  itemHoverTexto: string;
  titulo: string; // "FinancHub" e nome do usuário
  apoio: string; // subtítulo, seções, versão e e-mail
  itemAtivo: string; // fundo do item selecionado (texto branco)
  perigo: string; // "Sair da Conta"
};

// Telas com cards brancos (Transações e Inicial): variáveis --fnc-tx-<chave> (variaveisTelas).
export type CoresTransacoes = Record<
  | "overlay" // camada sobre o fundo/marca d'água da página
  | "superficie" // cards e tabela
  | "borda"
  | "divisoria" // entre linhas da tabela
  | "linhaAlternada"
  | "barraFiltros"
  | "texto"
  | "apoio"
  | "textoTabela"
  | "destaque" // card de saldo atual e botão principal
  | "sobreDestaque"
  | "legendaDestaque"
  | "chipFundo"
  | "chipTexto"
  | "botaoBorda"
  | "receita"
  | "receitaFundo"
  | "receitaBarra"
  | "despesa"
  | "despesaFundo"
  | "despesaBadge"
  | "despesaBarra"
  | "trilho" // fundo das barras de progresso
  | "blocoReceita" // blocos de receita/despesa dos cards de conta
  | "rotuloReceita"
  | "blocoDespesa",
  string
>;

// Telas de login e cadastro (LayoutAutenticacao.css lê como variáveis --fnc-login-<chave>).
export type CoresLogin = Record<
  | "esquemaCor"
  | "pagina"
  | "card"
  | "cardBorda"
  | "sombra"
  | "divisoria"
  | "titulo"
  | "subtitulo"
  | "label"
  | "campoFundo"
  | "campoBorda"
  | "campoTexto"
  | "foco"
  | "focoSombra"
  | "primaria"
  | "primariaHover"
  | "link"
  | "linkHover"
  | "erro"
  | "alertaFundo"
  | "alertaBorda"
  | "apagado"
  | "rodape"
  | "rodapeLink",
  string
>;

const primaria = {
  principal: "#155dfc",
};

export const CoresEscuro: Paleta = {
  primaria,
  secundaria: { principal: "#90a1b9" },
  fundo: {
    pagina: "#0e162a",
    superficie: "#1d293d",
    campo: "#314158",
  },
  borda: "#45556c",
  texto: "#fff",
  barraLateral: {
    fundo: "#0f172b",
    rodape: "#0f172b",
    contorno: "#45556c",
    divisoria: "#1d293d",
    item: "#90a1b9",
    itemHover: "rgba(255, 255, 255, 0.08)",
    itemHoverTexto: "#ffffff",
    titulo: "#ffffff",
    apoio: "#62748e",
    itemAtivo: primaria.principal,
    perigo: "#ff4b4b",
  },
  login: {
    esquemaCor: "dark",
    pagina: "#030a1f",
    card: "#1c2b5e",
    cardBorda: "#3d5292",
    sombra: "rgba(0, 0, 0, 0.55)",
    divisoria: "#33457d",
    titulo: "#e6ebff",
    subtitulo: "#b4bedc",
    label: "#dbe2f5",
    campoFundo: "#0a1330",
    campoBorda: "#7183c4",
    campoTexto: "#ffffff",
    foco: "#5b8cff",
    focoSombra: "rgba(91, 140, 255, 0.25)",
    primaria: "#2f5fe0",
    primariaHover: "#2552cc",
    link: "#8fb0ff",
    linkHover: "#b8ccff",
    erro: "#fda29b",
    alertaFundo: "rgba(240, 68, 56, 0.12)",
    alertaBorda: "#7a271a",
    apagado: "#9aa6cc",
    rodape: "#c3cdf0",
    rodapeLink: "#ffffff",
  },
  // os mesmos valores que os CSS antigos tinham fixos
  telas: {
    pagina: "#030a1f", // o mesmo fundo do login
    texto: "#ffffff",
    apoio: "#90a1b9",
    textoSuperficie: "#ffffff",
    apoioSuperficie: "#90a1b9",
    superficie: "rgba(29, 41, 61, 0.7)",
    cabecalho: "#314158",
    bordaSuave: "rgba(49, 65, 88, 0.5)",
    apagado: "#62748e",
    linhaHover: "rgba(255, 255, 255, 0.03)",
  },
  // o layout "Azul claro" adaptado ao escuro: mesmas superfícies das outras telas escuras
  transacoes: {
    overlay: "transparent",
    superficie: "#1d293d",
    borda: "#45556c",
    divisoria: "#314158",
    linhaAlternada: "#22304a",
    barraFiltros: "#233149",
    texto: "#ffffff",
    apoio: "#90a1b9",
    textoTabela: "#cbd5e1",
    destaque: "#2563eb",
    sobreDestaque: "#ffffff",
    legendaDestaque: "#dbeafe",
    chipFundo: "#1e3a8a",
    chipTexto: "#dbeafe",
    botaoBorda: "#45556c",
    receita: "#4ade80",
    receitaFundo: "rgba(74, 222, 128, 0.15)",
    receitaBarra: "#22c55e",
    despesa: "#f87171",
    despesaFundo: "rgba(248, 113, 113, 0.15)",
    despesaBadge: "#fca5a5",
    despesaBarra: "#ef4444",
    trilho: "#314158",
    blocoReceita: "rgba(74, 222, 128, 0.1)",
    rotuloReceita: "#86efac",
    blocoDespesa: "rgba(248, 113, 113, 0.1)",
  },
};

// Modo claro: superfícies claras para o MUI; a barra lateral fica em azul-marinho.
export const CoresClaro: Paleta = {
  primaria,
  secundaria: { principal: "#475569" }, // contraste 7.5:1 sobre branco
  fundo: {
    pagina: "#e2e8f0",
    superficie: "#ffffff",
    campo: "#f1f5f9",
  },
  borda: "#94a3b8",
  texto: "#0f172b",
  // Azul-marinho: a camada mais escura (barra) < fundo azul royal < cabeçalho e cards.
  // Textos com contraste mínimo de 4.5:1 sobre #061a5c.
  barraLateral: {
    fundo: "#061a5c",
    rodape: "#051548",
    contorno: "rgba(255, 255, 255, 0.06)",
    divisoria: "rgba(255, 255, 255, 0.08)",
    item: "#c3cdf0",
    itemHover: "rgba(255, 255, 255, 0.06)",
    itemHoverTexto: "#ffffff",
    titulo: "#ffffff",
    apoio: "#8f9bc4",
    itemAtivo: primaria.principal,
    perigo: "#ff4b4b",
  },
  login: {
    esquemaCor: "light",
    pagina: "#0d2f8f",
    card: "#ffffff",
    cardBorda: "transparent",
    sombra: "rgba(0, 0, 0, 0.35)",
    divisoria: "#e2e6ef",
    titulo: "#061a5c",
    subtitulo: "#4b5563",
    label: "#1f2937",
    campoFundo: "#f8f9fc",
    campoBorda: "#cbd2e1",
    campoTexto: "#1f2937",
    foco: "#0d2f8f",
    focoSombra: "rgba(13, 47, 143, 0.15)",
    primaria: "#0d2f8f",
    primariaHover: "#061a5c",
    link: "#0d2f8f",
    linkHover: "#061a5c",
    erro: "#b42318",
    alertaFundo: "#fef3f2",
    alertaBorda: "#fecdca",
    apagado: "#6b7280",
    rodape: "#d6defa",
    rodapeLink: "#ffffff",
  },
  // Como o card de resumo da tela inicial: cards, tabelas e seções na cor primária sólida,
  // texto branco e rótulos azul-claro. Os campos são do MUI (CampoTexto) e seguem o tema.
  telas: {
    pagina: "#eaf0f7", // branco gelo (puxado para o azul): os cards brancos se destacam do fundo
    // texto direto sobre a página branca; cards e tabelas usam textoSuperficie
    texto: "#0f172b",
    apoio: "#475569",
    textoSuperficie: "#ffffff",
    apoioSuperficie: "#bedbff", // o mesmo rótulo do ResumoContas
    superficie: primaria.principal,
    // sólido (= branco 12% sobre a primária): o cabeçalho fixo não pode deixar ver as linhas rolando por baixo
    cabecalho: "#3170fc",
    bordaSuave: "rgba(255, 255, 255, 0.2)",
    apagado: "#bedbff",
    linhaHover: "rgba(255, 255, 255, 0.08)",
  },
  transacoes: {
    // sem camada, como no escuro: a 85% ela apagava a logo da marca d'água
    overlay: "transparent",
    superficie: "#ffffff",
    borda: "#c7d7fe",
    divisoria: "#e1eafd",
    linhaAlternada: "#f7faff",
    barraFiltros: "#f4f8ff",
    texto: "#0f1e4a",
    apoio: "#3b4f86",
    textoTabela: "#334a80",
    destaque: "#2563eb",
    sobreDestaque: "#ffffff",
    legendaDestaque: "#dbeafe",
    chipFundo: "#dbeafe",
    chipTexto: "#1e3a8a",
    botaoBorda: "#bfd3fb",
    receita: "#15803d",
    receitaFundo: "#dcfce7",
    receitaBarra: "#22c55e",
    despesa: "#b91c1c",
    despesaFundo: "#fee2e2",
    despesaBadge: "#991b1b",
    despesaBarra: "#ef4444",
    trilho: "#e8f0fe",
    blocoReceita: "#f0fdf4",
    rotuloReceita: "#166534",
    blocoDespesa: "#fef2f2",
  },
};

// Barra lateral clara: em todas as telas no modo claro e na gaveta Modal.
export const BarraLateralClara: CoresBarraLateral = {
  fundo: "#ffffff",
  rodape: "#ffffff",
  contorno: "#c7d7fe",
  divisoria: "#e1eafd",
  item: "#1e3a8a",
  itemHover: "rgba(37, 99, 235, 0.08)",
  itemHoverTexto: "#1e3a8a",
  titulo: "#0f1e4a",
  apoio: "#3b4f86",
  itemAtivo: "#2563eb",
  perigo: "#b91c1c",
};

const variaveis = (prefixo: string, cores: Record<string, string>) =>
  Object.entries(cores).map(([chave, cor]) => [
    `--fnc-${prefixo}${chave.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}`,
    cor,
  ]);

// { "--fnc-texto-superficie": "#0f172b", "--fnc-tx-borda": "#c7d7fe", ... } para o style de quem envolve as telas.
export const variaveisTelas = (paleta: Paleta) =>
  Object.fromEntries([
    ...variaveis("", paleta.telas),
    ...variaveis("tx-", paleta.transacoes),
  ]) as CSSProperties;
