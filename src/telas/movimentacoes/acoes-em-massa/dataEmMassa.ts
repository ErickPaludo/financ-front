import dayjs from "dayjs";

import { FORMATO_DATA_HORA } from "../../../utils/formatacao.ts";

export type ModoData = "inteira" | "dia";

export const OPCOES_MODO_DATA: { rotulo: string; valor: ModoData }[] = [
  { rotulo: "Data inteira", valor: "inteira" },
  { rotulo: "Só o dia (mantém mês, ano e hora)", valor: "dia" },
];

export const OPCOES_DIA = Array.from({ length: 31 }, (_, i) => ({
  rotulo: String(i + 1),
  valor: String(i + 1),
}));

// Troca só o dia (FORMATO_DATA_HORA); mês, ano e hora ficam. Dia que o mês não tem vira o
// último dia dele (31 em fevereiro -> 28 ou 29), para não pular para o mês seguinte.
export const comDia = (data: string, dia: number) => {
  const original = dayjs(data);
  return original
    .date(Math.min(dia, original.daysInMonth()))
    .format(FORMATO_DATA_HORA);
};
