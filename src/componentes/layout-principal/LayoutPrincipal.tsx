import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";

import Conecta from "../../services/api/apiConnect";
import type { UsuarioResponse3 } from "../../models/usuario/UsuarioResponse";
import {
  buscarContas,
  sairDaConta,
} from "../../services/contas/contaUsuarioService";
import { useEncerrarSessao } from "../../hooks/useEncerrarSessao";
import { AuthContext } from "../../contexts/AuthContext";
import { ContaContext } from "../../contexts/ContaContext";
import Carregamento from "../carregamento/Carregamento";
import BarraLateral from "../barra-lateral/BarraLateral";
import MsgBox from "../../props/msg-box/MsgBox";
import { criarTema, tema as temaEscuro } from "../../tema";
import { CoresClaro, CoresEscuro, variaveisTelas } from "../../cores";
import { useModoCor } from "../../hooks/useModoCor";
import { ehTelaDaConta } from "../../utils/rotas";
import "./LayoutPrincipal.css";

// Telas com modo claro e fundo desfocado (inicial e tela da conta). As demais seguem no escuro.
const telaDeCards = (rota: string) => rota === "/" || ehTelaDaConta(rota);

// Estrutura das telas logadas: barra lateral + a tela da rota atual (Outlet).
const LayoutPrincipal: React.FC = () => {
  const { user, setUser, inicializando } = useContext(AuthContext);
  const { conta, limparConta } = useContext(ContaContext);
  const navigate = useNavigate();
  const rotaAtual = useLocation().pathname;

  const { modo, alternarModo } = useModoCor();
  const temaModo = useMemo(() => criarTema(modo), [modo]);
  const paginaTemModoClaro = telaDeCards(rotaAtual);
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
    const resposta = await Conecta<UsuarioResponse3>("/Usuarios/me", "GET");
    if (resposta.sucesso && resposta.dados) setUser(resposta.dados);
  };

  const deslogar = useEncerrarSessao();

  const sairDaContaBancaria = async () => {
    if (!conta) return navigate("/");
    const resposta = await sairDaConta(conta.idConta);
    if (resposta.sucesso) {
      limparConta();
      navigate("/");
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
            titulo="Ocorreu um problema!"
            descricao={erroMsg}
            tipo="aviso"
            centralizar
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
              className={`pagina-central${telaDeCards(rotaAtual) ? " fundo-desfocado" : ""}${ehTelaDaConta(rotaAtual) ? " pagina-transacoes" : ""}`}
            >
              <Outlet />
            </main>
          </div>
        </ThemeProvider>
      </div>
    </ThemeProvider>
  );
};

// Rota /:idConta/contabancaria: a conta vem da URL, então recarregar ou abrir o link direto funciona.
// Busca a conta quando ela não é a que está no contexto; inexistente, inativa ou sem acesso volta para a tela inicial (/).
export const ContaDaRota: React.FC = () => {
  const id = Number(useParams().idConta);
  const { conta, setConta } = useContext(ContaContext);
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const carregada = conta?.idConta === id;

  useEffect(() => {
    if (carregada || !Number.isInteger(id)) return;
    let ativo = true;
    buscarContas(id).then((resposta) => {
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
    return <Navigate to="/" replace />;
  return carregada ? <Outlet /> : <Carregamento />;
};

export default LayoutPrincipal;
