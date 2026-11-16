import { createTheme, type Theme } from "@mui/material/styles";
import type {} from "@mui/x-date-pickers/themeAugmentation"; // tipos de MuiPickers* em components
import { CoresClaro, CoresEscuro, type Paleta } from "./cores";

export type ModoCor = "claro" | "escuro";

// Visual dos campos (TextField e DatePicker). Fundo e borda no mesmo elemento: com o
// contorno do MUI por cima, as duas curvas arredondadas deixavam um serrilhado claro.
const estiloCampo = (Cores: Paleta, theme: Theme) => ({
  backgroundColor: Cores.fundo.campo,
  color: Cores.texto,
  fontSize: 14,
  border: `1px solid ${Cores.borda}`,
  // foco com 2px de destaque sem mudar o tamanho do campo
  "&.Mui-focused": {
    borderColor: theme.palette.primary.main,
    boxShadow: `inset 0 0 0 1px ${theme.palette.primary.main}`,
  },
  "&.Mui-error": { borderColor: theme.palette.error.main },
  "&.Mui-error.Mui-focused": {
    boxShadow: `inset 0 0 0 1px ${theme.palette.error.main}`,
  },
});

// Tema do MUI do app, no modo claro ou escuro.
export const criarTema = (modo: ModoCor) => {
  const Cores = modo === "claro" ? CoresClaro : CoresEscuro;

  return createTheme({
    palette: {
      mode: modo === "claro" ? "light" : "dark",
      primary: { main: Cores.primaria.principal },
      secondary: { main: Cores.secundaria.principal },
      text: { primary: Cores.texto, secondary: Cores.secundaria.principal },
      divider: Cores.borda,
      background: {
        default: Cores.fundo.pagina,
        paper: Cores.fundo.superficie,
      },
    },
    typography: { fontFamily: '"Inter", sans-serif' },
    shape: { borderRadius: 14 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            height: 40,
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
          },
        },
      },
      // Label fixo acima do campo (13px, cor de apoio).
      MuiInputLabel: {
        defaultProps: { shrink: true },
        styleOverrides: {
          root: {
            position: "relative",
            transform: "none",
            marginBottom: 5,
            // --fnc-apoio: claro sobre o fundo azul da página, escuro dentro de cards (cores.ts, telas)
            color: `var(--fnc-apoio, ${Cores.secundaria.principal})`,
            fontSize: 13,
            fontWeight: 600,
            "&.Mui-focused": {
              color: `var(--fnc-apoio, ${Cores.secundaria.principal})`,
            },
          },
        },
      },
      MuiOutlinedInput: {
        // sem o recorte na borda, já que o label fica fora do campo
        defaultProps: { notched: false },
        styleOverrides: {
          root: ({ theme }) => ({
            ...estiloCampo(Cores, theme),
            "& .MuiOutlinedInput-notchedOutline": { display: "none" },
          }),
          // 1px a menos que antes: a borda agora ocupa espaço dentro do campo
          input: { padding: "13px 17px" },
          // com ícone à esquerda, o espaçamento lateral fica com o ícone
          adornedStart: { paddingLeft: 18, "& input": { paddingLeft: 0 } },
        },
      },
      // Campo do DatePicker (MUI X): mesmo visual e altura do TextField acima.
      MuiPickersOutlinedInput: {
        defaultProps: { notched: false },
        styleOverrides: {
          root: ({ theme }) => ({
            ...estiloCampo(Cores, theme),
            padding: "0 17px",
            "& .MuiPickersOutlinedInput-notchedOutline": { display: "none" },
          }),
          sectionsContainer: { padding: "13px 0" },
        },
      },
      // Texto do checkbox com o mesmo visual do label dos campos.
      MuiFormControlLabel: {
        styleOverrides: {
          label: {
            color: `var(--fnc-apoio, ${Cores.secundaria.principal})`,
            fontSize: 13,
            fontWeight: 600,
          },
        },
      },
      MuiInputAdornment: {
        styleOverrides: { root: { color: Cores.secundaria.principal } },
      },
    },
  });
};

// Tema das telas que ainda só existem no modo escuro.
export const tema = criarTema("escuro");
