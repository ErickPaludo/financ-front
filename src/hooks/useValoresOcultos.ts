import { useState } from "react";

const CHAVE = "valoresOcultos";

// Preferência de esconder os valores em R$ (botão de olho). Salva no localStorage;
// o logout guarda as preferências pelo e-mail e o login seguinte as devolve (utils/preferencias.ts).
export function useValoresOcultos() {
  const [ocultos, setOcultos] = useState<boolean>(() => {
    try {
      return localStorage.getItem(CHAVE) === "true";
    } catch {
      return false; // localStorage bloqueado: começa mostrando
    }
  });

  const alternarOcultos = () => {
    const novo = !ocultos;
    setOcultos(novo);
    try {
      localStorage.setItem(CHAVE, String(novo));
    } catch {
      // sem persistência: vale só até recarregar a página
    }
  };

  return { ocultos, alternarOcultos };
}
