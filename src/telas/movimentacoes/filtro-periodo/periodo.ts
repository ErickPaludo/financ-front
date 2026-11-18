// Regras do filtro de período (datas em FORMATO_DATA_HORA, horário local).
// com extensão: scripts/testa-periodo.ts roda este arquivo direto no Node
import dayjs from "dayjs";

import { dataHoraLocal, periodoDoMes } from "../../../utils/formatacao.ts";

export type Periodo = { inicio: string; fim: string };

// dias de calendário tocados pelo período: 01/11 00:00 até 30/11 23:59 = 30
export const diasDoPeriodo = ({ inicio, fim }: Periodo) =>
  dayjs(fim).startOf("day").diff(dayjs(inicio).startOf("day"), "day") + 1;

// meses inteiros: começa no dia 1 às 00:00 e termina no último dia às 23:59
const mesesInteiros = ({ inicio, fim }: Periodo) =>
  inicio === dataHoraLocal(dayjs(inicio).startOf("month")) &&
  fim === dataHoraLocal(dayjs(fim).endOf("month"));

// Setas ‹ ›: desloca o período inteiro. Meses inteiros andam em meses (nov–dez → jan–fev);
// os demais andam o número de dias do período, mantendo os horários.
export function moverPeriodo(periodo: Periodo, direcao: 1 | -1): Periodo {
  const inicio = dayjs(periodo.inicio);
  const fim = dayjs(periodo.fim);
  if (mesesInteiros(periodo)) {
    const meses =
      (fim.year() - inicio.year()) * 12 + fim.month() - inicio.month() + 1;
    return {
      inicio: dataHoraLocal(
        inicio.add(direcao * meses, "month").startOf("month"),
      ),
      fim: dataHoraLocal(fim.add(direcao * meses, "month").endOf("month")),
    };
  }
  const dias = direcao * diasDoPeriodo(periodo);
  return {
    inicio: dataHoraLocal(inicio.add(dias, "day")),
    fim: dataHoraLocal(fim.add(dias, "day")),
  };
}

// Início depois do fim: o outro lado acompanha (sem estado de erro).
export const alterarInicio = (periodo: Periodo, inicio: string): Periodo => ({
  inicio,
  fim: inicio > periodo.fim ? inicio : periodo.fim,
});
export const alterarFim = (periodo: Periodo, fim: string): Periodo => ({
  inicio: fim < periodo.inicio ? fim : periodo.inicio,
  fim,
});

export const mesmoPeriodo = (a: Periodo, b: Periodo) =>
  a.inicio === b.inicio && a.fim === b.fim;

// atalhos do painel; "hoje" é parâmetro para o teste
export const atalhosPeriodo = (hoje = dayjs()) => [
  { rotulo: "Este mês", periodo: periodoDoMes(hoje) },
  { rotulo: "Mês passado", periodo: periodoDoMes(hoje.subtract(1, "month")) },
  {
    rotulo: "Últimos 30 dias",
    periodo: {
      inicio: dataHoraLocal(hoje.subtract(29, "day").startOf("day")),
      fim: dataHoraLocal(hoje.endOf("day")),
    },
  },
  {
    rotulo: "Este ano",
    periodo: {
      inicio: dataHoraLocal(hoje.startOf("year")),
      fim: dataHoraLocal(hoje.endOf("year")),
    },
  },
];
