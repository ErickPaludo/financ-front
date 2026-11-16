import dayjs from "dayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { FORMATO_DATA_HORA } from "../../utils/formatacao";

type PropCampoDataHora = {
  rotulo: string;
  valor: string; // FORMATO_DATA_HORA
  setValor: (valor: string) => void;
  minimo?: string; // FORMATO_DATA_HORA
  maximo?: string;
};

// Seletor de data e hora (DateTimePicker do MUI X) com o visual dos campos do app (tema.ts).
const CampoDataHora: React.FC<PropCampoDataHora> = ({
  rotulo,
  valor,
  setValor,
  minimo,
  maximo,
}) => (
  <DateTimePicker
    label={rotulo}
    value={dayjs(valor)}
    // ignora a digitação incompleta (ex.: "12/0"): só salva datas válidas
    onChange={(data) => {
      if (data?.isValid()) setValor(data.format(FORMATO_DATA_HORA));
    }}
    minDateTime={minimo ? dayjs(minimo) : undefined}
    maxDateTime={maximo ? dayjs(maximo) : undefined}
    slotProps={{ textField: { fullWidth: true } }}
  />
);

export default CampoDataHora;
