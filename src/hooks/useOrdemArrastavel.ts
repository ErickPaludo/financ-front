import { useRef, useState, type DragEvent, type PointerEvent } from "react";

import { moverId, ordenarPorIds, type Id } from "../utils/ordem";
import { useOrdemSalva } from "./useOrdemSalva";

// Espalhe na alça (ícone de 6 pontos) de cada item: com o dedo, só ela arrasta.
// touch-action: o dedo na alça arrasta o item em vez de rolar a página.
export const PROPS_ALCA = {
  "data-alca": "",
  style: { touchAction: "none" },
} as const;

const naAlca = (e: { target: EventTarget }) =>
  e.target instanceof Element && !!e.target.closest("[data-alca]");

// Itens reordenáveis arrastando, com a ordem salva na `chave` do localStorage.
// Espalhe `propsArrastar(id)` no elemento de cada item e `PROPS_ALCA` na alça dele.
// Mouse: drag and drop do HTML5 (o item inteiro). Toque: o HTML5 não funciona com o dedo (e o
// toque longo às vezes nem dispara o dragend), então a alça segue o ponteiro e acha o item
// embaixo dele pelo data-arrastavel.
export function useOrdemArrastavel<T, K extends Id>(
  chave: string,
  itens: T[],
  idDe: (item: T) => K,
) {
  const { ids: ordemSalva, salvarOrdem } = useOrdemSalva<K>(chave);
  const [arrastando, setArrastando] = useState<K | null>(null);
  const ultimoPonteiro = useRef("");
  const ordenados = ordenarPorIds(itens, ordemSalva, idDe);

  // o item vai para o lugar do que está embaixo do cursor
  const passarPorCima = (destino: K) => {
    if (arrastando === null || arrastando === destino) return;
    salvarOrdem(moverId(ordenados.map(idDe), arrastando, destino));
  };

  // fim do arraste pelo toque; com o mouse quem termina é o dragend (o pointercancel do
  // início do arraste nativo zeraria o item no meio)
  const soltarToque = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") setArrastando(null);
  };

  const propsArrastar = (id: K) => ({
    "data-arrastavel": String(id),
    draggable: true,
    // iOS: sem o balão do link no toque longo
    style: { WebkitTouchCallout: "none" } as const,
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      ultimoPonteiro.current = e.pointerType;
      if (e.pointerType === "mouse" || !naAlca(e)) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setArrastando(id);
    },
    onPointerMove: (e: PointerEvent) => {
      if (arrastando === null || e.pointerType === "mouse") return;
      const alvo = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest("[data-arrastavel]")
        ?.getAttribute("data-arrastavel");
      const destino = ordenados.map(idDe).find((i) => String(i) === alvo);
      if (destino !== undefined) passarPorCima(destino);
    },
    onPointerUp: soltarToque,
    onPointerCancel: soltarToque,
    // soltar a alça dentro de um card-link não abre o link (captura: antes do onClick do link)
    onClickCapture: (e: React.MouseEvent) => {
      if (naAlca(e)) e.preventDefault();
    },
    // Android: sem o menu do link no toque longo; com o mouse, o botão direito continua igual
    onContextMenu: (e: React.MouseEvent) => {
      if (ultimoPonteiro.current === "touch") e.preventDefault();
    },
    onDragStart: (e: DragEvent) => {
      if (ultimoPonteiro.current !== "mouse") return e.preventDefault();
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
