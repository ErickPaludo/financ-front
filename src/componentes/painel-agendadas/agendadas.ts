// Movimentações agendadas (fixas): tipos, constantes e datas, usados pelo painel e pelo formulário.
import type { Movimentacao } from "../../models/movimentacoes/GetMovimentacoes";

export type Agendada = {
  id: number;
  tipo: number; // tipo de ocorrência (OCORRENCIA)
  dataInicio: string;
  dataFim: string;
  dataOcorrencia: string;
  ocorrenciaDiaria: number[]; // dias da semana (ids de DIAS_SEMANA)
  expirado: boolean;
  movimentacaoBase: Movimentacao;
};

export const OCORRENCIA = { Semanal: "0", Mensal: "1", Anual: "2" };

export const NOME_OCORRENCIA: Record<number, string> = {
  0: "Semanal",
  1: "Mensal",
  2: "Anual",
};

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
].map((nome, id) => ({ id, nome }));

export const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
].map((rotulo, i) => ({ rotulo, valor: String(i + 1) }));

// fevereiro com 28: a data de ocorrência é gravada num ano fixo (ANO_OCORRENCIA)
export const DIAS_POR_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const ANO_OCORRENCIA = 2026;

// A API devolve as datas das agendadas 3h à frente: volta para o horário de Brasília.
export const paraHorarioBrasilia = (iso: string) =>
  new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000);

const doisDigitos = (n: number) => String(n).padStart(2, "0");

// "YYYY-MM-DDTHH:mm" para os campos de data
export const dataParaCampo = (iso: string) => {
  if (!iso) return "";
  const d = paraHorarioBrasilia(iso);
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}T${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;
};

// "16/11/2026"; com anual, sem o ano ("16/11")
export const formatarDataAgendada = (iso: string, comAno = true) => {
  if (!iso) return "-";
  const d = paraHorarioBrasilia(iso);
  const diaMes = `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}`;
  return comAno ? `${diaMes}/${d.getFullYear()}` : diaMes;
};

export const descreverOcorrencia = (agendada: Agendada) => {
  if (agendada.tipo === 0)
    return agendada.ocorrenciaDiaria
      .map((d) => DIAS_SEMANA[d]?.nome)
      .join(", ");
  if (!agendada.dataOcorrencia) return "-";
  return agendada.tipo === 1
    ? `Dia ${paraHorarioBrasilia(agendada.dataOcorrencia).getDate()}`
    : formatarDataAgendada(agendada.dataOcorrencia, false);
};
