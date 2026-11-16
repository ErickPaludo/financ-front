import { Box, CircularProgress, Typography } from "@mui/material";

import logoClara from "../../assets/pldprojects-logo-azul-clara.svg";

// Tela de carregamento sem fundo próprio: aparece sobre fundos escuros/azuis (área central e abertura do app),
// por isso usa sempre a logo clara.
const Carregamento: React.FC = () => (
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
      src={logoClara}
      alt="PLDProjects"
      sx={{ width: { xs: 160, sm: 200 } }}
    />
    <CircularProgress aria-label="Carregando" />
    <Typography sx={{ fontWeight: 600, textAlign: "center" }}>
      Estamos preparando tudo para você!
    </Typography>
  </Box>
);

export default Carregamento;
