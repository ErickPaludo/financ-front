import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

type PropTituloPagina = {
  titulo: string;
  subtitulo?: ReactNode;
};

// Título (h1) das telas logadas, com uma linha de apoio opcional embaixo.
const TituloPagina: React.FC<PropTituloPagina> = ({ titulo, subtitulo }) => (
  <Box>
    <Typography
      component="h1"
      sx={{
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        color: "var(--fnc-tx-texto)",
      }}
    >
      {titulo}
    </Typography>
    {subtitulo && (
      <Typography sx={{ fontSize: 13, color: "var(--fnc-tx-apoio)" }}>
        {subtitulo}
      </Typography>
    )}
  </Box>
);

export default TituloPagina;
