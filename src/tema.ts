import { createTheme } from "@mui/material/styles";
import { CoresClaro, CoresEscuro } from "./cores";

export type ModoCor = "claro" | "escuro";

// Tema do MUI com o visual dos componentes antigos (InputText / LabelText), no modo claro ou escuro.
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
      // Visual do FncButton padrão (degradê azul).
      MuiButton: {
        styleOverrides: {
          root: {
            height: 40,
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
            variants: [
              {
                props: { variant: "contained", color: "primary" },
                style: {
                  background: Cores.primaria.gradiente,
                  boxShadow: "0px 4px 6px -4px rgba(43, 127, 255, 0.25)",
                },
              },
            ],
          },
        },
      },
      // Label fixo acima do campo, como o LabelText.
      MuiInputLabel: {
        defaultProps: { shrink: true },
        styleOverrides: {
          root: {
            position: "relative",
            transform: "none",
            marginBottom: 5,
            color: Cores.secundaria.principal,
            fontSize: 13,
            fontWeight: 600,
            "&.Mui-focused": { color: Cores.secundaria.principal },
          },
        },
      },
      MuiOutlinedInput: {
        // sem o recorte na borda, já que o label fica fora do campo
        defaultProps: { notched: false },
        styleOverrides: {
          // Fundo e borda no mesmo elemento: com o fieldset do MUI por cima,
          // as duas curvas arredondadas deixavam um serrilhado claro no contorno.
          root: ({ theme }) => ({
            backgroundColor: Cores.fundo.campo,
            color: Cores.texto,
            fontSize: 14,
            border: `1px solid ${Cores.borda}`,
            "& .MuiOutlinedInput-notchedOutline": { display: "none" },
            // foco com 2px de destaque sem mudar o tamanho do campo
            "&.Mui-focused": {
              borderColor: theme.palette.primary.main,
              boxShadow: `inset 0 0 0 1px ${theme.palette.primary.main}`,
            },
            "&.Mui-error": { borderColor: theme.palette.error.main },
            "&.Mui-error.Mui-focused": {
              boxShadow: `inset 0 0 0 1px ${theme.palette.error.main}`,
            },
          }),
          // 1px a menos que antes: a borda agora ocupa espaço dentro do campo
          input: { padding: "13px 17px" },
          // com ícone à esquerda, o espaçamento lateral fica com o ícone
          adornedStart: { paddingLeft: 18, "& input": { paddingLeft: 0 } },
        },
      },
      // Texto do checkbox com o visual do LabelText.
      MuiFormControlLabel: {
        styleOverrides: {
          label: {
            color: Cores.secundaria.principal,
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
