import { useContext, useEffect, useState } from "react";

import type {
  ContaBancaria,
  ContaResponse,
} from "../models/contas-usuarios/GetContasBancarias";
import { AuthContext } from "../contexts/AuthContext";
import { buscarContaUsuario } from "../services/contas/contaUsuarioService";
import { PERMISSAO } from "../utils/permissao";
import { useBuscaApi } from "./useBuscaApi";

const permitida = (permissao: number | undefined, comAdministrador: boolean) =>
  permissao === PERMISSAO.Mestre ||
  (comAdministrador && permissao === PERMISSAO.Administrador);

// Contas ativas em que o usuário logado é mestre (quem pode convidar); com `comAdministrador`,
// também as em que é administrador (quem pode transferir). undefined = ainda buscando.
// shortcut: a lista de contas não traz a permissão, então é 1 requisição por conta; se a API
// passar a devolver a permissão na lista (/ContasUsuarios), troque por um filtro.
export function useContasMestre(comAdministrador = false) {
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
          permitida(resposta.dados?.conteudo[0]?.permissao, comAdministrador)
            ? conta
            : null,
        ),
      ),
    ).then((resultado) => {
      if (ativo)
        setContasMestre(
          resultado.filter((c): c is ContaBancaria => c !== null),
        );
    });
    return () => {
      ativo = false;
    };
  }, [dados, user, comAdministrador]);

  // sem contas (a API responde vazio): nenhuma conta para convidar
  if (!carregando && !dados) return [];
  return contasMestre;
}
