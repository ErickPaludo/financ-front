import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import InputCheckBox from "../input-check-box/InputCheckBox";
import { ehDataCompleta } from "../../utils/formatacao";
import { MAXIMO_REPETICOES, type useRepeticao } from "../../hooks/useRepeticao";

// Checkbox + "Repetir até" (mês/ano); `texto` descreve o que será criado (ex.: "12 transações").
const CampoRepetir: React.FC<{
  repeticao: ReturnType<typeof useRepeticao>;
  texto: (vezes: number) => string;
}> = ({ repeticao: r, texto }) => (
  <>
    <InputCheckBox
      rotulo="Repetir nos meses seguintes"
      marcado={r.repetir}
      setMarcado={r.setRepetir}
    />
    {r.repetir && (
      <DatePicker
        label="Repetir até"
        views={["year", "month"]}
        openTo="month"
        format="MM/YYYY"
        value={dayjs(r.repetirAte)}
        onChange={(data) => {
          if (ehDataCompleta(data)) r.setRepetirAte(data.format("YYYY-MM"));
        }}
        minDate={dayjs(r.dataMovimentacao).add(1, "month")}
        maxDate={dayjs(r.dataMovimentacao).add(MAXIMO_REPETICOES - 1, "month")}
        slotProps={{
          textField: {
            fullWidth: true,
            error: Boolean(r.erro),
            helperText: r.erro ?? texto(r.vezes),
          },
        }}
      />
    )}
  </>
);

export default CampoRepetir;
