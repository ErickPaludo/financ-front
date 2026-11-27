import { useState } from "react";
import dayjs from "dayjs";

export const MAXIMO_REPETICOES = 48;
// quantos meses do mês da data até o mês escolhido, contando os dois
const mesesAte = (data: string, ate: string) =>
  dayjs(ate).diff(dayjs(data).startOf("month"), "month") + 1;

// "Repetir nos meses seguintes": uma movimentação por mês a partir da data, até o mês escolhido.
// Guarda quantos meses, não o mês final: mudar a data leva o "Repetir até" junto (pedido do usuário).
export function useRepeticao(dataMovimentacao: string) {
  const [repetir, setRepetir] = useState(false);
  const [meses, setMeses] = useState(2);
  const repetirAte = dayjs(dataMovimentacao)
    .add(meses - 1, "month")
    .format("YYYY-MM");
  const setRepetirAte = (ate: string) =>
    setMeses(mesesAte(dataMovimentacao, ate));
  // repetir desligado = 1 vez (só a data da movimentação)
  const vezes = repetir ? meses : 1;
  const erro = !repetir
    ? null
    : vezes < 2
      ? "Escolha um mês depois do da transação."
      : vezes > MAXIMO_REPETICOES
        ? `No máximo ${MAXIMO_REPETICOES} meses.`
        : null;
  return {
    dataMovimentacao,
    repetir,
    setRepetir,
    repetirAte,
    setRepetirAte,
    vezes,
    erro,
  };
}
