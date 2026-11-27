import { useSyncExternalStore } from "react";

// Calculadora aberta ou fechada: a barra lateral e as gavetas (filtros, cadastro) abrem a mesma calculadora.
let aberta = false;
const avisos = new Set<() => void>();

const assinar = (avisar: () => void) => {
  avisos.add(avisar);
  return () => {
    avisos.delete(avisar);
  };
};

const definir = (valor: boolean) => {
  aberta = valor;
  avisos.forEach((avisar) => avisar());
};

export function useCalculadora() {
  const calculadoraAberta = useSyncExternalStore(assinar, () => aberta);
  return {
    calculadoraAberta,
    alternarCalculadora: () => definir(!aberta),
    fecharCalculadora: () => definir(false),
  };
}
