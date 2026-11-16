// Paletas do app. Fonte única das cores: o tema do MUI (tema.ts) e os componentes leem daqui.

export type Paleta = {
  primaria: { principal: string; gradiente: string };
  secundaria: { principal: string }; // labels, subtítulos e ícones
  fundo: { pagina: string; superficie: string; campo: string };
  borda: string;
  texto: string;
  login: CoresLogin;
};

// Telas de login e cadastro (LayoutAutenticacao.css lê como variáveis --fnc-login-<chave>).
export type CoresLogin = Record<
  | "esquemaCor" | "pagina" | "card" | "cardBorda" | "sombra" | "divisoria"
  | "titulo" | "subtitulo" | "label" | "campoFundo" | "campoBorda" | "campoTexto"
  | "foco" | "focoSombra" | "primaria" | "primariaHover" | "link" | "linkHover"
  | "erro" | "alertaFundo" | "alertaBorda" | "apagado" | "rodape" | "rodapeLink",
  string
>;

const primaria = {
  principal: "#155dfc",
  gradiente: "linear-gradient(90deg, #2b7fff, #4f39f6)",
};

export const CoresEscuro: Paleta = {
  primaria,
  secundaria: { principal: "#90a1b9" },
  fundo: { pagina: "#0e162a", superficie: "#1d293d", campo: "#314158" },
  borda: "#45556c",
  texto: "#fff",
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
};

export const CoresClaro: Paleta = {
  primaria,
  secundaria: { principal: "#62748e" },
  fundo: { pagina: "#f1f5f9", superficie: "#ffffff", campo: "#f8fafc" },
  borda: "#cad5e2",
  texto: "#0f172b",
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
};

// As telas fora do login ainda só existem no modo escuro.
export const Cores = CoresEscuro;
