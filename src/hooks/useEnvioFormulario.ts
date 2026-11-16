import { useState } from "react";

// Ação do formulário: devolve a mensagem de erro para exibir, ou nada quando não há erro geral.
type AcaoEnvio = () => Promise<string | void>;

// Controla o envio de um formulário: bloqueio durante o envio, erro geral e se já houve tentativa.
export function useEnvioFormulario(acao: AcaoEnvio) {
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setTentouEnviar(true);
    setEnviando(true);
    setErro((await acao()) ?? null);
    setEnviando(false);
  };

  return { enviar, tentouEnviar, enviando, erro };
}

export type EnvioFormulario = ReturnType<typeof useEnvioFormulario>;
