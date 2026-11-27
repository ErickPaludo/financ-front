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
// Passando dos limites (limitesDatas), a seta não anda.
export function moverPeriodo(
  periodo: Periodo,
  direcao: 1 | -1,
  hoje = dayjs(),
): Periodo {
  const movido = deslocar(periodo, direcao);
  return foraDosLimites(movido, hoje) ? periodo : movido;
}

function deslocar(periodo: Periodo, direcao: 1 | -1): Periodo {
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

// período máximo do filtro, e o quanto cada data pode se afastar de hoje (para trás ou para a frente)
export const MAXIMO_ANOS = 100;
const somarAnos = (data: string, anos: number) =>
  dataHoraLocal(dayjs(data).add(anos, "year"));

// "hoje" é parâmetro para o teste
export const limitesDatas = (hoje = dayjs()) => ({
  minimo: dataHoraLocal(hoje.subtract(MAXIMO_ANOS, "year").startOf("day")),
  maximo: dataHoraLocal(hoje.add(MAXIMO_ANOS, "year").endOf("day")),
});

const limitarData = (data: string, hoje = dayjs()) => {
  const { minimo, maximo } = limitesDatas(hoje);
  return data < minimo ? minimo : data > maximo ? maximo : data;
};

export const foraDosLimites = ({ inicio, fim }: Periodo, hoje = dayjs()) => {
  const { minimo, maximo } = limitesDatas(hoje);
  return inicio < minimo || fim > maximo;
};

export const passaDoMaximo = ({ inicio, fim }: Periodo) =>
  fim > somarAnos(inicio, MAXIMO_ANOS);

// Data fora dos limites vai até o limite; início depois do fim, ou período acima do máximo:
// o outro lado acompanha (sem estado de erro).
// As datas estão em FORMATO_DATA_HORA, então comparar o texto compara as datas.
export function alterarInicio(
  periodo: Periodo,
  novoInicio: string,
  hoje = dayjs(),
): Periodo {
  const inicio = limitarData(novoInicio, hoje);
  const limite = somarAnos(inicio, MAXIMO_ANOS);
  const fim = periodo.fim > limite ? limite : periodo.fim;
  return { inicio, fim: inicio > fim ? inicio : fim };
}
export function alterarFim(
  periodo: Periodo,
  novoFim: string,
  hoje = dayjs(),
): Periodo {
  const fim = limitarData(novoFim, hoje);
  const limite = somarAnos(fim, -MAXIMO_ANOS);
  const inicio = periodo.inicio < limite ? limite : periodo.inicio;
  return { inicio: fim < inicio ? fim : inicio, fim };
}

export const mesmoPeriodo = (a: Periodo, b: Periodo) =>
  a.inicio === b.inicio && a.fim === b.fim;

// atalhos do painel; "hoje" é parâmetro para o teste
export const atalhosPeriodo = (hoje = dayjs()) => [
  {
    rotulo: "Hoje",
    periodo: {
      inicio: dataHoraLocal(hoje.startOf("day")),
      fim: dataHoraLocal(hoje.endOf("day")),
    },
  },
  { rotulo: "Este mês", periodo: periodoDoMes(hoje) },
  { rotulo: "Mês passado", periodo: periodoDoMes(hoje.subtract(1, "month")) },
  { rotulo: "Próximo mês", periodo: periodoDoMes(hoje.add(1, "month")) },
  {
    rotulo: "Últimos 7 dias",
    periodo: {
      inicio: dataHoraLocal(hoje.subtract(6, "day").startOf("day")),
      fim: dataHoraLocal(hoje.endOf("day")),
    },
  },
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
