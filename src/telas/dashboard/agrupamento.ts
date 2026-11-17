// com extensão: scripts/testa-agrupamento.ts roda este arquivo direto no Node
import dayjs from "dayjs";

import { dataHoraLocal } from "../../utils/formatacao.ts";
import type { Movimentacao } from "../../models/movimentacoes/GetMovimentacoes";

export type PontoGrafico = { rotulo: string; entradas: number; saidas: number };

// até ~2 meses, um ponto por dia; acima disso, por mês (senão as barras viram fios)
const DIAS_MAXIMOS_POR_DIA = 62;

// Soma entradas e saídas do período em dias (ou meses), incluindo os vazios com zero:
// o eixo mostra o período inteiro, não só os dias com movimento.
export function agruparPorPeriodo(
  movimentacoes: Pick<Movimentacao, "tipo" | "valor" | "dthrMovimentacao">[],
  inicio: string, // FORMATO_DATA_HORA
  fim: string,
): PontoGrafico[] {
  const unidade =
    dayjs(fim).diff(dayjs(inicio), "day") < DIAS_MAXIMOS_POR_DIA
      ? "day"
      : "month";
  const formato = unidade === "day" ? "DD/MM" : "MM/YYYY";

  const pontos = new Map<string, PontoGrafico>();
  for (
    let d = dayjs(inicio).startOf(unidade);
    !d.isAfter(dayjs(fim), unidade);
    d = d.add(1, unidade)
  ) {
    const rotulo = d.format(formato);
    pontos.set(rotulo, { rotulo, entradas: 0, saidas: 0 });
  }

  for (const mov of movimentacoes) {
    const ponto = pontos.get(
      dayjs(dataHoraLocal(mov.dthrMovimentacao)).format(formato),
    );
    if (!ponto) continue; // fora do período
    if (mov.tipo === 0) ponto.entradas += mov.valor;
    else ponto.saidas += mov.valor;
  }
  return [...pontos.values()];
}

export type FatiaCategoria = {
  id: number;
  label: string;
  value: number;
  color: string;
};

// Total do tipo (0 entrada, 1 saída) por categoria, da maior para a menor, na cor da categoria.
// Movimentação com várias categorias divide o valor igualmente entre elas: somar o valor inteiro
// em cada uma contaria duas vezes e a pizza passaria do total do período.
export function agruparPorCategoria(
  movimentacoes: Pick<Movimentacao, "tipo" | "valor" | "categorias">[],
  tipo: number,
  semCategoria: { nome: string; cor: string },
): FatiaCategoria[] {
  const fatias = new Map<number, FatiaCategoria>();
  for (const mov of movimentacoes) {
    if (mov.tipo !== tipo) continue;
    const categorias = mov.categorias.length
      ? mov.categorias
      : [{ idCategoria: 0, nome: semCategoria.nome, cor: semCategoria.cor }];
    const parte = mov.valor / categorias.length;
    for (const c of categorias) {
      const fatia = fatias.get(c.idCategoria) ?? {
        id: c.idCategoria,
        label: c.nome,
        value: 0,
        color: c.cor || semCategoria.cor,
      };
      fatia.value += parte;
      fatias.set(c.idCategoria, fatia);
    }
  }
  // categoria sem valor no período (ex.: só movimentações de R$ 0) não entra: viraria "0%" na legenda
  return [...fatias.values()]
    .filter((f) => f.value > 0)
    .sort((a, b) => b.value - a.value);
}
