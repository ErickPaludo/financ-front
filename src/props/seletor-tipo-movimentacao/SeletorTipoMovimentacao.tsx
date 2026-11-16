import { ToggleButton, ToggleButtonGroup } from "@mui/material";

import { TIPO_MOVIMENTACAO } from "../../models/movimentacoes/GetMovimentacoes";

const OPCOES = [
  { valor: TIPO_MOVIMENTACAO.Receita, rotulo: "Receita", cor: "receita" },
  { valor: TIPO_MOVIMENTACAO.Despesa, rotulo: "Despesa", cor: "despesa" },
];

type PropSeletorTipoMovimentacao = {
  valor: number;
  setValor: (tipo: number) => void;
  bloqueado?: boolean; // ex.: movimentação concluída não troca de tipo
};

// Receita / Despesa lado a lado; o escolhido fica na cor do tipo (variáveis --fnc-tx-*).
const SeletorTipoMovimentacao: React.FC<PropSeletorTipoMovimentacao> = ({
  valor,
  setValor,
  bloqueado = false,
}) => (
  <ToggleButtonGroup
    exclusive
    fullWidth
    value={valor}
    // clicar no já escolhido devolve null: mantém o tipo atual
    onChange={(_, novo: number | null) => novo !== null && setValor(novo)}
    disabled={bloqueado}
    aria-label="Tipo da movimentação"
    sx={{ gap: 1.5 }}
  >
    {OPCOES.map(({ valor: tipo, rotulo, cor }) => (
      <ToggleButton
        key={tipo}
        value={tipo}
        sx={{
          // separados (gap): cada um com a borda e os cantos inteiros
          "&&": { border: "2px solid", borderRadius: "12px", m: 0 },
          borderColor: "divider",
          color: "text.secondary",
          fontWeight: 600,
          textTransform: "none",
          "&.Mui-selected, &.Mui-selected:hover": {
            borderColor: `var(--fnc-tx-${cor})`,
            color: `var(--fnc-tx-${cor})`,
            bgcolor: `var(--fnc-tx-${cor}-fundo)`,
          },
        }}
      >
        {rotulo}
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
);

export default SeletorTipoMovimentacao;
