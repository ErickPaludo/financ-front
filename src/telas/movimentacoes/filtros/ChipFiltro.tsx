import { useState } from "react";
import { Box, Button, Icon, IconButton, Menu, MenuItem } from "@mui/material";

import type { OpcaoSelect } from "../../../props/input-select/InputSelect";

type PropChipFiltro = {
  texto: string;
  aberto: boolean;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
  onLimpar?: () => void; // com ele, o chip mostra um X que desfaz o filtro
};

// Botão com cara de chip ("Status: Todas ▾") que abre a lista de um filtro.
export const ChipFiltro: React.FC<PropChipFiltro> = ({
  texto,
  aberto,
  onClick,
  onLimpar,
}) => (
  // o X fica ao lado do botão, não dentro (botão dentro de botão não é HTML válido)
  <Box sx={{ position: "relative", display: "inline-flex" }}>
    <Button
      onClick={onClick}
      aria-haspopup="listbox"
      aria-expanded={aberto}
      endIcon={<Icon>{aberto ? "expand_less" : "expand_more"}</Icon>}
      sx={{
        height: 36, // mesma altura dos campos de data do FiltroPeriodo
        px: 2,
        borderRadius: 999,
        bgcolor: "var(--fnc-tx-chip-fundo)",
        color: "var(--fnc-tx-chip-texto)",
        fontSize: 13,
        fontWeight: 600,
        pr: onLimpar ? 6.5 : 2, // espaço para o X
        "&:hover": {
          bgcolor: "var(--fnc-tx-chip-fundo)",
          boxShadow: "inset 0 0 0 1px currentColor",
        },
      }}
    >
      {texto}
    </Button>
    {onLimpar && (
      <IconButton
        size="small"
        aria-label={`Limpar ${texto}`}
        onClick={onLimpar}
        sx={{
          position: "absolute",
          right: 34, // antes da seta
          top: "50%",
          transform: "translateY(-50%)",
          p: 0.25,
          color: "var(--fnc-tx-chip-texto)",
        }}
      >
        <Icon sx={{ fontSize: 16 }}>close</Icon>
      </IconButton>
    )}
  </Box>
);

type PropChipSelect = {
  rotulo: string;
  valor: string;
  opcoes: OpcaoSelect[];
  setValor: (valor: string) => void;
};

// Chip + menu de escolha única (Status, Tipo).
export const ChipSelect: React.FC<PropChipSelect> = ({
  rotulo,
  valor,
  opcoes,
  setValor,
}) => {
  const [ancora, setAncora] = useState<HTMLElement | null>(null);
  const atual = opcoes.find((o) => o.valor === valor)?.rotulo ?? valor;

  return (
    <>
      <ChipFiltro
        texto={`${rotulo}: ${atual}`}
        aberto={!!ancora}
        onClick={(e) => setAncora(e.currentTarget)}
      />
      <Menu
        anchorEl={ancora}
        open={!!ancora}
        onClose={() => setAncora(null)}
        slotProps={{ list: { "aria-label": rotulo } }}
      >
        {opcoes.map((o) => (
          <MenuItem
            key={o.valor}
            selected={o.valor === valor}
            onClick={() => {
              setValor(o.valor);
              setAncora(null);
            }}
            sx={{ minHeight: 44 }}
          >
            {o.rotulo}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
