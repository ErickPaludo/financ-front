import React, { useState, useEffect, useContext } from "react";
import api from "../../services/api/apiConnect";
import type { ContaResponse } from "../../models/contas-usuarios/GetContasBancarias";
import { useNavigate } from "react-router-dom";
import type { UsuarioResponse3 } from "../../models/usuario/UsuarioResponse";
import "./HomeStyle.css";
import Contas from "../contas-bancarias/Contas";
import { AuthContext } from "../../contexts/AuthContext";
import Carregamento from "../../componentes/carregamento/Carregamento";
import BarraLateral from "../../componentes/barra-lateral/BarraLateral";
import { ContaContext } from "../../contexts/ContaContext";
import Movimentacoes from "../movimentacoes/Movimentacoes";
import Convites from "../convites/Convites";
import MsgBox from "../../props/msg-box/MsgBox";
import { TypeMsgBox } from "../../props/msg-box/TypeMsgBox";
import Membros from "../membros/Membros";
import EditaConta from "../contas-bancarias/edita-conta/EditaConta";
import MovimentacaoFixa from "../movimentacoes/fixas/MovimentacaoFixa";
import OpcoesUsuario from "../usuario/OpcoesUsuario";

export const Home: React.FC = () => {
  const { user, logout, setUser, inicializando } = useContext(AuthContext);
  const { conta, removeConta } = useContext(ContaContext);

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [telaAtual, setTelaAtual] = useState(0);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  const buscarUsuario = async () => {
    const resposta = await api<UsuarioResponse3>(
      "/Usuarios/me",
      "GET",
      undefined,
    );
    if (resposta.sucesso && resposta.dados) {
      setUser(resposta.dados);
    }
  };

  const deslogar = async () => {
    await api<ContaResponse>("/Autenticacao/revoke", "POST", undefined);
    logout();
    removeConta();
    navigate("/login", { replace: true });
  };

  const sairDaContaBancaria = async () => {
    const response = await api<string>(
      `/ContasUsuarios/${conta?.idConta}/sair`,
      "POST",
    );
    if (response!.sucesso) {
      removeConta();
      setTelaAtual(0);
    } else {
      setErroMsg(response!.erro!);
    }
  };

  useEffect(() => {
    if (inicializando) return;
    const init = async () => {
      if (!user) {
        await buscarUsuario();
      }
      setLoading(false);
    };
    init();
  }, [inicializando]);

  if (loading) {
    return <Carregamento />;
  }

  const retornaTelas = () => {
    if (telaAtual === 0 && user !== null)
      return <Contas setTelaAtual={setTelaAtual} />;
    if (telaAtual === 1) return <Movimentacoes />;
    if (telaAtual === 3) return <Convites />;
    if (telaAtual === 4) return <Membros />;
    if (telaAtual === 5) return <EditaConta setRetorno={setTelaAtual} />;
    if (telaAtual === 6) return <MovimentacaoFixa />;
    if (telaAtual === 7) return <OpcoesUsuario />;
  };

  return (
    <div className="home-container">
      {erroMsg && (
        <MsgBox
          title="Ocorreu um problema!"
          description={erroMsg}
          type={TypeMsgBox.Ok}
          centerlize={true}
        />
      )}

      <BarraLateral
        telaAtual={telaAtual}
        setTelaAtual={setTelaAtual}
        onSairDaConta={sairDaContaBancaria}
        onDeslogar={deslogar}
      />

      <main className="pagina-central">{retornaTelas()}</main>
    </div>
  );
};
