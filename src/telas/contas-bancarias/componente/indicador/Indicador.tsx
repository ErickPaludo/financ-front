import { Box, Icon, Stack, Typography } from "@mui/material";

import { exibirMoeda } from "../../../../utils/formatacao";

type PropIndicador = {
  icone: string;
  rotulo: string;
  valor: number;
  oculto?: boolean; // esconde o valor (botão de olho)
};

// Valor com ícone e rótulo (receitas/despesas pendentes). Herda a cor do texto do card.
const Indicador: React.FC<PropIndicador> = ({
  icone,
  rotulo,
  valor,
  oculto = false,
}) => (
  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: "10px",
        display: "grid",
        placeItems: "center",
        bgcolor: "rgba(255, 255, 255, 0.15)",
      }}
    >
      <Icon sx={{ fontSize: 14 }}>{icone}</Icon>
    </Box>
    <Box>
      <Typography sx={{ fontSize: 11, color: "inherit", opacity: 0.85 }}>
        {rotulo}
      </Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 700, color: "inherit" }}>
        {exibirMoeda(valor, oculto)}
      </Typography>
    </Box>
  </Stack>
);

export default Indicador;
