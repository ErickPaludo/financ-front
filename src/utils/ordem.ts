// Ordem definida pelo usuário arrastando (cards de conta, gráficos do dashboard): lista de ids.

export type Id = number | string;

// Ordena pelos ids salvos. Itens que não estão na lista (novos) vão para o fim, na ordem original.
export function ordenarPorIds<T, K extends Id>(
  itens: T[],
  ids: K[],
  idDe: (item: T) => K,
): T[] {
  const posicao = new Map(ids.map((id, i) => [id, i]));
  return itens
    .map((item, i) => ({
      item,
      chave: posicao.get(idDe(item)) ?? ids.length + i,
    }))
    .sort((a, b) => a.chave - b.chave)
    .map(({ item }) => item);
}

// Move o id arrastado para a posição do id de destino.
// Arrastando para frente, entra depois do destino; para trás, antes (como ao arrastar na tela).
export function moverId<K extends Id>(ids: K[], arrastado: K, destino: K): K[] {
  const de = ids.indexOf(arrastado);
  const para = ids.indexOf(destino);
  if (de === -1 || para === -1 || de === para) return ids;

  const resultado = ids.filter((id) => id !== arrastado);
  resultado.splice(
    resultado.indexOf(destino) + (de < para ? 1 : 0),
    0,
    arrastado,
  );
  return resultado;
}
