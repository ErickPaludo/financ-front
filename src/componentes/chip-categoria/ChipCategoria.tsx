import { Chip } from "@mui/material";

import { coresChipCategoria } from "../../utils/corCategoria";

type PropChipCategoria = {
  nome: string;
  cor: string; // hex que vem da API
  tamanho?: "small" | "medium";
};

// Categoria como chip na cor exata dela (tabela, lista e prévia da gaveta de categorias).
const ChipCategoria: React.FC<PropChipCategoria> = ({ nome, cor, tamanho = "small" }) => {
  const cores = coresChipCategoria(cor);
  return (
    <Chip
      label={nome}
      size={tamanho}
      sx={{
        borderRadius: 999,
        fontWeight: 600,
        bgcolor: cores?.fundo ?? "var(--fnc-tx-chip-fundo)",
        color: cores?.texto ?? "var(--fnc-tx-chip-texto)",
      }}
    />
  );
};

export default ChipCategoria;
