import { useContext, useEffect, useState } from "react";

import type {
  ContaBancaria,
  ContaResponse,
} from "../models/contas-usuarios/GetContasBancarias";
import { AuthContext } from "../contexts/AuthContext";
import { buscarContaUsuario } from "../services/contas/contaUsuarioService";
import { PERMISSAO } from "../utils/permissao";
import { useBuscaApi } from "./useBuscaApi";

// Contas ativas em que o usuário logado é mestre (quem pode convidar). undefined = ainda buscando.
// shortcut: a lista de contas não traz a permissão, então é 1 requisição por conta; se a API
// passar a devolver a permissão na lista (/ContasUsuarios), troque por um filtro.
export function useContasMestre() {
  const { user } = useContext(AuthContext);
  const { dados, carregando } = useBuscaApi<ContaResponse>("/ContasUsuarios");
  const [contasMestre, setContasMestre] = useState<ContaBancaria[]>();

  useEffect(() => {
    if (!dados || !user) return;
    let ativo = true;
    const ativas = dados.conteudo.contas.filter((c) => c.status === 0);
    Promise.all(
      ativas.map((conta) =>
        buscarContaUsuario(conta.idConta, user.id).then((resposta) =>
          resposta.dados?.conteudo[0]?.permissao === PERMISSAO.Mestre
            ? conta
            : null,
        ),
      ),
    ).then((resultado) => {
      if (ativo)
        setContasMestre(resultado.filter((c): c is ContaBancaria => c !== null));
    });
    return () => {
      ativo = false;
    };
  }, [dados, user]);

  // sem contas (a API responde vazio): nenhuma conta para convidar
  if (!carregando && !dados) return [];
  return contasMestre;
}
