import { useState } from "react";

// Liga/desliga salvo no localStorage na chave dada ("true"/"false"); o logout guarda por e-mail.
export function useFlagSalva(chave: string, padrao = false) {
  const [valor, setValor] = useState<boolean>(() => {
    try {
      const salvo = localStorage.getItem(chave);
      return salvo === null ? padrao : salvo === "true";
    } catch {
      return padrao; // localStorage bloqueado
    }
  });

  const salvar = (novo: boolean) => {
    setValor(novo);
    try {
      localStorage.setItem(chave, String(novo));
    } catch {
      // sem persistência: vale só até recarregar a página
    }
  };

  return [valor, salvar] as const;
}
