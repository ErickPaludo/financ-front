import { useId, type ReactNode } from "react";
import dayjs from "dayjs";
import { Box, InputLabel, Stack } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { FORMATO_DATA_HORA } from "../../utils/formatacao";

type PropCampoDataHora = {
  label: string;
  valor: string; // FORMATO_DATA_HORA
  setValor: (valor: string) => void;
  minimo?: string; // FORMATO_DATA_HORA
  maximo?: string;
  // botões ao lado do campo, na mesma altura dele (ex.: ButtonGroup)
  acoes?: ReactNode;
};

// Seletor de data e hora (DateTimePicker do MUI X) com o visual dos campos do app (tema.ts).
const CampoDataHora: React.FC<PropCampoDataHora> = ({
  label,
  valor,
  setValor,
  minimo,
  maximo,
  acoes,
}) => {
  const idRotulo = useId();

  const seletor = (
    <DateTimePicker
      // com ações, o rótulo fica fora (acima da linha) para campo e botões terem a mesma altura
      label={acoes ? undefined : label}
      value={dayjs(valor)}
      // ignora a digitação incompleta (ex.: "12/0"): só salva datas válidas
      onChange={(data) => {
        if (data?.isValid()) setValor(data.format(FORMATO_DATA_HORA));
      }}
      minDateTime={minimo ? dayjs(minimo) : undefined}
      maxDateTime={maximo ? dayjs(maximo) : undefined}
      slotProps={{
        textField: {
          fullWidth: true,
          slotProps: acoes
            ? { input: { "aria-labelledby": idRotulo } }
            : undefined,
        },
      }}
    />
  );

  if (!acoes) return seletor;

  return (
    <Box>
      <InputLabel id={idRotulo}>{label}</InputLabel>
      <Stack direction="row" spacing={1} sx={{ alignItems: "stretch" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>{seletor}</Box>
        {acoes}
      </Stack>
    </Box>
  );
};

export default CampoDataHora;
