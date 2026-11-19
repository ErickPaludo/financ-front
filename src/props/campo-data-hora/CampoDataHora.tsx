import dayjs from "dayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { ehDataCompleta, FORMATO_DATA_HORA } from "../../utils/formatacao";

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
    // Digitando o ano, o campo passa por 0002, 0020, 0202: só salva com o ano completo e dentro
    // dos limites. Salvar o meio do caminho fazia a tela corrigir a data (ex.: puxar até o limite
    // de 100 anos) e a digitação virava outro ano. Fora dos limites, o campo fica em erro.
    onChange={(data) => {
      if (!ehDataCompleta(data)) return;
      const texto = data.format(FORMATO_DATA_HORA);
      if ((minimo && texto < minimo) || (maximo && texto > maximo)) return;
      setValor(texto);
    }}
    minDateTime={minimo ? dayjs(minimo) : undefined}
    maxDateTime={maximo ? dayjs(maximo) : undefined}
    slotProps={{ textField: { fullWidth: true } }}
  />
);

export default CampoDataHora;
