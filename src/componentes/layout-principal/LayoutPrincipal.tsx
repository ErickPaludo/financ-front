import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";

import api from "../../services/api/apiConnect";
import type { UsuarioResponse3 } from "../../models/usuario/UsuarioResponse";
import type { ContaResponse } from "../../models/contas-usuarios/GetContasBancarias";
import { AuthContext } from "../../contexts/AuthContext";
import { ContaContext } from "../../contexts/ContaContext";
import Carregamento from "../carregamento/Carregamento";
import BarraLateral from "../barra-lateral/BarraLateral";
import MsgBox from "../../props/msg-box/MsgBox";
import { TypeMsgBox } from "../../props/msg-box/TypeMsgBox";
import { criarTema, tema as temaEscuro } from "../../tema";
import { CoresClaro, CoresEscuro, variaveisTelas } from "../../cores";
import { useModoCor } from "../../hooks/useModoCor";
import "./LayoutPrincipal.css";

// Telas que já têm estilo de modo claro. As demais seguem no escuro até serem migradas.
const ROTAS_COM_MODO_CLARO = ["/inicial", "/agendadas", "/membros"];
const temModoClaro = (rota: string) =>
  ROTAS_COM_MODO_CLARO.includes(rota) || rota.endsWith("/contabancaria");

const temFundoDesfocado = (rota: string) =>
  rota === "/inicial" || rota.endsWith("/contabancaria");

// Estrutura das telas logadas: barra lateral + a tela da rota atual (Outlet).
const LayoutPrincipal: React.FC = () => {
  const { user, logout, setUser, inicializando } = useContext(AuthContext);
  const { conta, removeConta } = useContext(ContaContext);
  const navigate = useNavigate();
  const rotaAtual = useLocation().pathname;

  const { modo, alternarModo } = useModoCor();
  const temaModo = useMemo(() => criarTema(modo), [modo]);
  const paginaTemModoClaro = temModoClaro(rotaAtual);
  const temaPagina = paginaTemModoClaro ? temaModo : temaEscuro;
  const coresPagina =
    paginaTemModoClaro && modo === "claro" ? CoresClaro : CoresEscuro;
  // fundo da página + marca d'água: escuro como o login, ou branco com a marca azul-escura no modo claro
  const fundoClaro = coresPagina === CoresClaro;
  const classeFundo = `fnc-fundo-marca${fundoClaro ? " fnc-fundo-marca--escura" : ""}`;
  const fundoPagina = {
    ...variaveisTelas(coresPagina), // cores dos componentes antigos (--fnc-*)
    backgroundColor: coresPagina.telas.pagina,
    color: coresPagina.telas.texto,
  };

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

  // o Carregamento não tem fundo próprio: sem isso aparecia o preto do body ao recarregar
  if (carregando)
    return (
      <ThemeProvider theme={temaPagina}>
        <div
          className={classeFundo}
          style={{ ...fundoPagina, display: "flex" }}
        >
          <Carregamento />
        </div>
      </ThemeProvider>
    );

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
          {/* fundo no invólucro: o desfoque (backdrop-filter do main) só atinge o fundo, não o conteúdo */}
          <div className={`area-central ${classeFundo}`} style={fundoPagina}>
            <main
              className={`pagina-central${temFundoDesfocado(rotaAtual) ? " fundo-desfocado" : ""}${rotaAtual.endsWith("/contabancaria") ? " pagina-transacoes" : ""}`}
            >
              <Outlet />
            </main>
          </div>
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

// Rota /:idConta/contabancaria: a conta vem da URL, então recarregar ou abrir o link direto funciona.
// Busca a conta quando ela não é a que está no contexto; inexistente, inativa ou sem acesso volta para /inicial.
export const ContaDaRota: React.FC = () => {
  const id = Number(useParams().idConta);
  const { conta, setConta } = useContext(ContaContext);
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const carregada = conta?.idConta === id;

  useEffect(() => {
    if (carregada || !Number.isInteger(id)) return;
    let ativo = true;
    api<ContaResponse>(`/ContasUsuarios?id=${id}`, "GET").then((resposta) => {
      if (!ativo) return;
      const encontrada = resposta.dados?.conteudo.contas[0];
      if (encontrada?.idConta === id && encontrada.status === 0)
        setConta(encontrada);
      else setNaoEncontrada(true);
    });
    return () => {
      ativo = false;
    };
  }, [id, carregada, setConta]);

  if (!Number.isInteger(id) || naoEncontrada)
    return <Navigate to="/inicial" replace />;
  return carregada ? <Outlet /> : <Carregamento />;
};

export default LayoutPrincipal;
