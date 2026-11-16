import React, { useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";

import api from "../../services/api/apiConnect";
import type { UsuarioResponse3 } from "../../models/usuario/UsuarioResponse";
import { AuthContext } from "../../contexts/AuthContext";
import { ContaContext } from "../../contexts/ContaContext";
import Carregamento from "../carregamento/Carregamento";
import BarraLateral from "../barra-lateral/BarraLateral";
import MsgBox from "../../props/msg-box/MsgBox";
import { TypeMsgBox } from "../../props/msg-box/TypeMsgBox";
import { criarTema, tema as temaEscuro } from "../../tema";
import { CoresClaro, CoresEscuro } from "../../cores";
import { useModoCor } from "../../hooks/useModoCor";
import "./LayoutPrincipal.css";

// Telas que já têm estilo de modo claro. As demais seguem no escuro até serem migradas.
const ROTAS_COM_MODO_CLARO = ["/inicial"];

// Estrutura das telas logadas: barra lateral + a tela da rota atual (Outlet).
const LayoutPrincipal: React.FC = () => {
  const { user, logout, setUser, inicializando } = useContext(AuthContext);
  const { conta, removeConta } = useContext(ContaContext);
  const navigate = useNavigate();
  const rotaAtual = useLocation().pathname;

  const { modo, alternarModo } = useModoCor();
  const temaModo = useMemo(() => criarTema(modo), [modo]);
  const paginaTemModoClaro = ROTAS_COM_MODO_CLARO.includes(rotaAtual);
  const temaPagina = paginaTemModoClaro ? temaModo : temaEscuro;
  const coresPagina =
    paginaTemModoClaro && modo === "claro" ? CoresClaro : CoresEscuro;

  const [carregando, setCarregando] = useState(true);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  const buscarUsuario = async () => {
    const resposta = await api<UsuarioResponse3>("/Usuarios/me", "GET");
    if (resposta.sucesso && resposta.dados) setUser(resposta.dados);
  };

  const deslogar = async () => {
    await api("/Autenticacao/revoke", "POST");
    logout();
    removeConta();
    navigate("/login", { replace: true });
  };

  const sairDaContaBancaria = async () => {
    const resposta = await api<string>(
      `/ContasUsuarios/${conta?.idConta}/sair`,
      "POST",
    );
    if (resposta.sucesso) {
      removeConta();
      navigate("/inicial");
    } else {
      setErroMsg(resposta.erro ?? "Não foi possível sair da conta");
    }
  };

  useEffect(() => {
    if (inicializando) return;
    const carregarUsuario = async () => {
      if (!user) await buscarUsuario();
      setCarregando(false);
    };
    carregarUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roda uma vez, quando a sessão termina de inicializar
  }, [inicializando]);

  if (carregando) return <Carregamento />;

  return (
    <ThemeProvider theme={temaModo}>
      <div className="layout-principal">
        {erroMsg && (
          <MsgBox
            title="Ocorreu um problema!"
            description={erroMsg}
            type={TypeMsgBox.Ok}
            centerlize={true}
          />
        )}

        <BarraLateral
          modo={modo}
          onAlternarModo={alternarModo}
          onSairDaConta={sairDaContaBancaria}
          onDeslogar={deslogar}
        />

        <ThemeProvider theme={temaPagina}>
          {/* mesmo fundo do login: cor da página + marca d'água; texto claro nos dois modos */}
          <main
            className="pagina-central fnc-fundo-marca"
            style={{
              backgroundColor: coresPagina.login.pagina,
              color: coresPagina.login.rodapeLink,
            }}
          >
            <Outlet />
          </main>
        </ThemeProvider>
      </div>
    </ThemeProvider>
  );
};

// Telas que dependem de uma conta bancária selecionada. A conta fica só em memória:
// ao recarregar a página ela se perde, então volta para a tela inicial.
export const ExigeConta: React.FC = () => {
  const { conta } = useContext(ContaContext);
  return conta ? <Outlet /> : <Navigate to="/inicial" replace />;
};

export default LayoutPrincipal;
