import { useState } from "react";

import type { Id } from "../utils/ordem";

// shortcut: a ordem fica só neste navegador (localStorage; o logout guarda por e-mail).
// Para valer em qualquer dispositivo, o backend precisa guardar a posição de cada item.
function lerOrdem(chave: string): Id[] {
  try {
    const salvo = JSON.parse(localStorage.getItem(chave) ?? "[]");
    return Array.isArray(salvo)
      ? salvo.filter((id) => typeof id === "number" || typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

// Ordem definida pelo usuário arrastando, salva no localStorage na chave dada
// (ex.: `ordemContas:<idUsuario>`, `ordemDashboard:<idUsuario>`).
export function useOrdemSalva<K extends Id>(chave: string) {
  const [ids, setIds] = useState<K[]>(() => lerOrdem(chave) as K[]);

  const salvarOrdem = (novosIds: K[]) => {
    setIds(novosIds);
    try {
      localStorage.setItem(chave, JSON.stringify(novosIds));
    } catch {
      // sem persistência: a ordem vale só até recarregar a página
    }
  };

  return { ids, salvarOrdem };
}
