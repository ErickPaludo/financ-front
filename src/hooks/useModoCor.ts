import { useState } from "react";
import type { ModoCor } from "../tema";

const CHAVE_MODO = "modoCor";

// Preferência salva; sem ela, segue o tema do sistema operacional.
function lerModoInicial(): ModoCor {
  try {
    const salvo = localStorage.getItem(CHAVE_MODO);
    if (salvo === "claro" || salvo === "escuro") return salvo;
  } catch {
    // localStorage bloqueado (aba anônima, por exemplo): usa o sistema
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "claro"
    : "escuro";
}

export function useModoCor() {
  const [modo, setModo] = useState<ModoCor>(lerModoInicial);

  const alternarModo = () => {
    const novoModo = modo === "claro" ? "escuro" : "claro";
    setModo(novoModo);
    try {
      localStorage.setItem(CHAVE_MODO, novoModo);
    } catch {
      // sem persistência: o modo vale só até recarregar a página
    }
  };

  return { modo, alternarModo };
}
