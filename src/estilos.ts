// Estilos (sx) usados por mais de uma tela. Cores pelas variáveis --fnc-tx-* (cores.ts).

// Botão de contorno das telas de cards (Inicial e Transações), ao lado do botão principal.
export const estiloBotaoSecundario = {
  height: 44,
  borderRadius: "10px",
  bgcolor: "var(--fnc-tx-superficie)",
  border: "1px solid var(--fnc-tx-botao-borda)",
  color: "var(--fnc-tx-chip-texto)",
  "&:hover": { bgcolor: "var(--fnc-tx-chip-fundo)" },
};

// Largura em que a barra lateral vira barra superior (também em LayoutPrincipal.css).
export const CONSULTA_CELULAR = "(max-width:768px)";
