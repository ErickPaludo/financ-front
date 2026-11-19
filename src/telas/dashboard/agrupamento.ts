// com extensão: scripts/testa-agrupamento.ts roda este arquivo direto no Node
import dayjs from "dayjs";

import { dataHoraLocal } from "../../utils/formatacao.ts";
import type { Movimentacao } from "../../models/movimentacoes/GetMovimentacoes";

export type PontoGrafico = {
  rotulo: string;
  entradas: number;
  saidas: number;
};

// até ~2 meses, um ponto por dia; acima disso, por mês (senão as barras viram fios)
const DIAS_MAXIMOS_POR_DIA = 62;

// Rótulos do eixo X do período inteiro (dias, ou meses se passar de ~2 meses) e o rótulo de
// cada data: o eixo mostra o período todo, não só os dias com movimento.
function eixoDoPeriodo(inicio: string, fim: string) {
  const unidade =
    dayjs(fim).diff(dayjs(inicio), "day") < DIAS_MAXIMOS_POR_DIA
      ? "day"
      : "month";
  const formato = unidade === "day" ? "DD/MM" : "MM/YYYY";
  const rotulos: string[] = [];
  for (
    let d = dayjs(inicio).startOf(unidade);
    !d.isAfter(dayjs(fim), unidade);
    d = d.add(1, unidade)
  )
    rotulos.push(d.format(formato));
  const rotuloDe = (data: string) => dayjs(dataHoraLocal(data)).format(formato);
  return { rotulos, rotuloDe };
}

// Soma entradas e saídas do período em dias (ou meses), incluindo os vazios com zero.
export function agruparPorPeriodo(
  movimentacoes: Pick<
    Movimentacao,
    "tipo" | "valor" | "dthrMovimentacao"
  >[],
  inicio: string, // FORMATO_DATA_HORA
  fim: string,
): PontoGrafico[] {
  const { rotulos, rotuloDe } = eixoDoPeriodo(inicio, fim);
  const pontos = new Map<string, PontoGrafico>(
    rotulos.map((rotulo) => [
      rotulo,
      { rotulo, entradas: 0, saidas: 0 },
    ]),
  );

  for (const mov of movimentacoes) {
    const ponto = pontos.get(rotuloDe(mov.dthrMovimentacao));
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
// Movimentação com várias categorias conta o valor inteiro em cada uma, como o filtro de categoria
// da tela da conta; por isso a soma das fatias pode passar do total do período.
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
    for (const c of categorias) {
      const fatia = fatias.get(c.idCategoria) ?? {
        id: c.idCategoria,
        label: c.nome,
        value: 0,
        color: c.cor || semCategoria.cor,
      };
      fatia.value += mov.valor;
      fatias.set(c.idCategoria, fatia);
    }
  }
  // categoria sem valor no período (ex.: só movimentações de R$ 0) não entra: viraria "0%" na legenda
  return [...fatias.values()]
    .filter((f) => f.value > 0)
    .sort((a, b) => b.value - a.value);
}

// A pizza ao longo do tempo: total de cada categoria (as mesmas de agruparPorCategoria) por dia
// ou mês. Cada ponto é { rotulo, "c<idCategoria>": valor }, para uma série por categoria.
export function agruparCategoriasPorPeriodo(
  movimentacoes: Pick<
    Movimentacao,
    "tipo" | "valor" | "categorias" | "dthrMovimentacao"
  >[],
  tipo: number,
  semCategoria: { nome: string; cor: string },
  inicio: string,
  fim: string,
) {
  const categorias = agruparPorCategoria(movimentacoes, tipo, semCategoria);
  const { rotulos, rotuloDe } = eixoDoPeriodo(inicio, fim);
  const vazio = () =>
    Object.fromEntries(categorias.map((c) => [`c${c.id}`, 0])) as Record<
      string,
      number
    >;
  const pontos = new Map(
    rotulos.map((rotulo) => [rotulo, { rotulo, ...vazio() }]),
  );

  for (const mov of movimentacoes) {
    const ponto = pontos.get(rotuloDe(mov.dthrMovimentacao)) as
      Record<string, number> | undefined;
    if (mov.tipo !== tipo || !ponto) continue;
    const ids = mov.categorias.length
      ? mov.categorias.map((c) => c.idCategoria)
      : [0];
    // como na pizza: o valor inteiro em cada categoria
    for (const id of ids) if (`c${id}` in ponto) ponto[`c${id}`] += mov.valor;
  }
  return { categorias, pontos: [...pontos.values()] };
}

// "Ignorar categorias" do dashboard: tira só as categorias ignoradas de cada movimentação
// (A e B, ignorando B, fica só A). Sai inteira só a que tinha categoria e ficou sem nenhuma;
// a que já não tinha categoria continua ("Sem categoria").
export function semCategoriasIgnoradas<T extends Pick<Movimentacao, "categorias">>(
  movimentacoes: T[],
  ignoradas: number[],
): T[] {
  if (ignoradas.length === 0) return movimentacoes;
  return movimentacoes.flatMap((mov) => {
    const categorias = mov.categorias.filter(
      (c) => !ignoradas.includes(c.idCategoria),
    );
    if (mov.categorias.length > 0 && categorias.length === 0) return [];
    return [{ ...mov, categorias }];
  });
}
