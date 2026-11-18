import { useState, type DragEvent } from "react";

import { moverId, ordenarPorIds, type Id } from "../utils/ordem";
import { useOrdemSalva } from "./useOrdemSalva";

// Itens reordenáveis arrastando (HTML5 drag and drop), com a ordem salva na `chave` do localStorage.
// Espalhe `propsArrastar(id)` no elemento de cada item.
export function useOrdemArrastavel<T, K extends Id>(
  chave: string,
  itens: T[],
  idDe: (item: T) => K,
) {
  const { ids: ordemSalva, salvarOrdem } = useOrdemSalva<K>(chave);
  const [arrastando, setArrastando] = useState<K | null>(null);
  const ordenados = ordenarPorIds(itens, ordemSalva, idDe);

  // o item vai para o lugar do que está embaixo do cursor
  const passarPorCima = (destino: K) => {
    if (arrastando === null || arrastando === destino) return;
    salvarOrdem(moverId(ordenados.map(idDe), arrastando, destino));
  };

  const propsArrastar = (id: K) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(id)); // o Firefox exige algum dado
      setArrastando(id);
    },
    onDragEnter: () => passarPorCima(id),
    onDragOver: (e: DragEvent) => e.preventDefault(), // permite soltar sobre o item
    onDrop: (e: DragEvent) => e.preventDefault(),
    onDragEnd: () => setArrastando(null),
  });

  return { ordenados, arrastando, propsArrastar };
}
