import { useSyncExternalStore } from "react";

const CHAVE = "funcoesExperimentais";
const EVENTO = "funcoesExperimentais"; // avisa as outras partes da mesma aba (o "storage" só vem de outras abas)

const ler = () => {
  try {
    return localStorage.getItem(CHAVE) === "true";
  } catch {
    return false; // localStorage bloqueado: desligadas
  }
};

const assinar = (avisar: () => void) => {
  window.addEventListener(EVENTO, avisar);
  window.addEventListener("storage", avisar);
  return () => {
    window.removeEventListener(EVENTO, avisar);
    window.removeEventListener("storage", avisar);
  };
};

// Funções experimentais (ex.: Importar CSV): ligadas no painel do usuário, salvas no localStorage.
// O painel e a tela ficam abertos juntos, por isso o estado é compartilhado (useSyncExternalStore).
export function useExperimentais() {
  const ativas = useSyncExternalStore(assinar, ler);
  const alternarExperimentais = () => {
    try {
      localStorage.setItem(CHAVE, String(!ativas));
    } catch {
      // sem localStorage não dá para ligar
    }
    window.dispatchEvent(new Event(EVENTO));
  };
  return { ativas, alternarExperimentais };
}
