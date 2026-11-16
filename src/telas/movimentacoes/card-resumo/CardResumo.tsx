import type { ReactNode } from "react";
import { Box, Icon, Stack, Typography } from "@mui/material";

type PropCardResumo = {
  rotulo: string;
  valor?: string; // sem valor: o conteúdo fica só nos children (ex.: vários valores)
  icone: string;
  corIcone: string; // variável CSS (--fnc-tx-*)
  corValor?: string;
  destaque?: boolean; // fundo na cor de destaque, texto branco
  children?: ReactNode; // legenda, badge ou barra de progresso
};

// Card de saldo da tela da conta (topo e "Ver detalhes").
const CardResumo: React.FC<PropCardResumo> = ({
  rotulo,
  valor,
  icone,
  corIcone,
  corValor,
  destaque = false,
  children,
}) => (
  <Box
    sx={{
      p: 2.5,
      borderRadius: "16px",
      bgcolor: destaque ? "var(--fnc-tx-destaque)" : "var(--fnc-tx-superficie)",
      color: destaque ? "var(--fnc-tx-sobre-destaque)" : "var(--fnc-tx-texto)",
      border: destaque ? 0 : "1px solid var(--fnc-tx-borda)",
      display: "flex",
      flexDirection: "column",
      gap: 1,
    }}
  >
    <Stack
      direction="row"
      sx={{ justifyContent: "space-between", alignItems: "center" }}
    >
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 500,
          color: destaque ? "var(--fnc-tx-legenda-destaque)" : "var(--fnc-tx-apoio)",
        }}
      >
        {rotulo}
      </Typography>
      <Box
        aria-hidden
        sx={{
          width: 32,
          height: 32,
          borderRadius: "8px",
          display: "grid",
          placeItems: "center",
          color: corIcone,
          // fundo suave na própria cor do ícone
          bgcolor: "color-mix(in srgb, currentColor 15%, transparent)",
        }}
      >
        <Icon sx={{ fontSize: 18 }}>{icone}</Icon>
      </Box>
    </Stack>
    {valor !== undefined && (
    <Typography
      sx={{
        fontSize: 30,
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
        fontVariantNumeric: "tabular-nums",
        color: corValor ?? "inherit",
      }}
    >
      {valor}
    </Typography>
    )}
    {children}
  </Box>
);

export default CardResumo;
