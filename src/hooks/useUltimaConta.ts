import { useEffect, useState } from "react";

const chave = (idUsuario: string) => `ultimaConta:${idUsuario}`;

const ler = (idUsuario?: string) => {
  if (!idUsuario) return null;
  try {
    const id = Number(localStorage.getItem(chave(idUsuario)));
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null; // localStorage bloqueado (aba anônima): começa sem última conta
  }
};

// Id da última conta bancária aberta pelo usuário, salvo no localStorage (sobrevive ao recarregar).
// idContaAberta: a conta da tela atual, ou null fora das telas da conta.
export function useUltimaConta(
  idUsuario: string | undefined,
  idContaAberta: number | null,
) {
  const [ultima, setUltima] = useState(() => ler(idUsuario));

  // abriu uma conta: ela passa a ser a última (ajuste durante o render, sem efeito extra)
  if (idContaAberta !== null && idContaAberta !== ultima) setUltima(idContaAberta);

  useEffect(() => {
    if (!idUsuario || ultima === null) return;
    try {
      localStorage.setItem(chave(idUsuario), String(ultima));
    } catch {
      // sem persistência: vale só até recarregar a página
    }
  }, [idUsuario, ultima]);

  return ultima;
}
