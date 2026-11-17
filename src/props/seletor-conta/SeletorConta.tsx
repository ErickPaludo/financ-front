import { Box, MenuItem, Stack } from "@mui/material";

import type { ContaBancaria } from "../../models/contas-usuarios/GetContasBancarias";
import CampoTexto from "../campo-texto/CampoTexto";

type PropSeletorConta = {
  contas: ContaBancaria[];
  valor: number | null; // idConta escolhida
  setValor: (idConta: number) => void;
  rotulo?: string;
};

// Escolha de uma conta bancária (ex.: para qual conta vai o convite), com a cor de cada conta.
const SeletorConta: React.FC<PropSeletorConta> = ({
  contas,
  valor,
  setValor,
  rotulo = "Conta",
}) => (
  <CampoTexto
    select
    label={rotulo}
    valor={valor === null ? "" : String(valor)}
    setValor={(id) => setValor(Number(id))}
    // sem conta escolhida, mostra o texto de ajuda em vez de um campo em branco
    slotProps={{ select: { displayEmpty: true } }}
  >
    <MenuItem value="" disabled>
      Selecione a conta
    </MenuItem>
    {contas.map((conta) => (
      <MenuItem key={conta.idConta} value={String(conta.idConta)}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
          <Box
            aria-hidden
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              flexShrink: 0,
              bgcolor: conta.cor,
            }}
          />
          <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {conta.titulo}
          </Box>
        </Stack>
      </MenuItem>
    ))}
  </CampoTexto>
);

export default SeletorConta;
