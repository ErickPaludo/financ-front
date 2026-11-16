// Ordem dos cards de conta definida pelo usuário (lista de ids).

// Ordena pelos ids salvos. Contas que não estão na lista (novas) vão para o fim, na ordem da API.
export function ordenarPorIds<T>(
  itens: T[],
  ids: number[],
  idDe: (item: T) => number,
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
export function moverId(
  ids: number[],
  arrastado: number,
  destino: number,
): number[] {
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
