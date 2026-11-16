import { Box, CircularProgress, Typography, useTheme } from "@mui/material";

import logoClara from "../../assets/pldprojects-logo-azul-clara.svg";
import logoAzul from "../../assets/pldprojects-logo-azul.svg";

// Tela de carregamento sem fundo próprio: logo clara sobre fundo escuro e
// azul sobre o fundo branco (tema claro da área central).
const Carregamento: React.FC = () => {
  const claro = useTheme().palette.mode === "light";
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        minHeight: "100dvh",
        flex: 1,
        p: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        color: "inherit", // usa a cor do texto de onde aparece
      }}
    >
      <Box
        component="img"
        src={claro ? logoAzul : logoClara}
        alt="PLDProjects"
        sx={{ width: { xs: 160, sm: 200 } }}
      />
      <CircularProgress aria-label="Carregando" />
      <Typography sx={{ fontWeight: 600, textAlign: "center" }}>
        Estamos preparando tudo para você!
      </Typography>
    </Box>
  );
};

export default Carregamento;
