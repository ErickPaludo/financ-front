import { useState } from "react";

// shortcut: a ordem fica só neste navegador (localStorage) e é apagada no logout (localStorage.clear()).
// Para valer em qualquer dispositivo, o backend precisa guardar a posição de cada conta.
function lerOrdem(chave: string): number[] {
  try {
    const salvo = JSON.parse(localStorage.getItem(chave) ?? "[]");
    return Array.isArray(salvo)
      ? salvo.filter((id) => typeof id === "number")
      : [];
  } catch {
    return [];
  }
}

// Ordem dos cards de conta do usuário, salva por usuário.
export function useOrdemContas(idUsuario: string | undefined) {
  const chave = `ordemContas:${idUsuario ?? "anonimo"}`;
  const [ids, setIds] = useState<number[]>(() => lerOrdem(chave));

  const salvarOrdem = (novosIds: number[]) => {
    setIds(novosIds);
    try {
      localStorage.setItem(chave, JSON.stringify(novosIds));
    } catch {
      // sem persistência: a ordem vale só até recarregar a página
    }
  };

  return { ids, salvarOrdem };
}
