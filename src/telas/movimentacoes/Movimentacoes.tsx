import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  FormControlLabel,
  Icon,
  IconButton,
  LinearProgress,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";

import Conecta from "../../services/api/apiConnect";
import {
  buscarContas,
  buscarContaUsuario,
} from "../../services/contas/contaUsuarioService";
import type {
  GetMovimentacoes,
  Movimentacao,
} from "../../models/movimentacoes/GetMovimentacoes";
import { ContaContext } from "../../contexts/ContaContext";
import { AuthContext } from "../../contexts/AuthContext";
import { useCategorias } from "../../hooks/useCategorias";
import { useValoresOcultos } from "../../hooks/useValoresOcultos";
import BotaoOcultarValores from "../../componentes/botao-ocultar-valores/BotaoOcultarValores";
import Modal from "../../componentes/modal/Modal";
import TituloPagina from "../../componentes/titulo-pagina/TituloPagina";
import Categorias from "../categorias/Categorias";
import CadMov from "./cad-mov/CadMov";
import CadConvite from "../../componentes/painel-convites/CadConvite";
import TabelaMovimentacao from "./tabela/TabelaMovimentacao";
import CardResumo from "./card-resumo/CardResumo";
import FiltrosConta from "./filtros/FiltrosConta";
import { useFiltrosUrl } from "./useFiltrosUrl";
import { passaNosFiltros, rotaMovimentacoes } from "./filtrosUrl";
import {
  formatarDataHora,
  exibirMoeda,
  normalizarNome,
  valorComSinal,
} from "../../utils/formatacao";
import { nomePermissao, PERMISSAO } from "../../utils/permissao";
import { CONSULTA_CELULAR, estiloBotaoSecundario } from "../../estilos";
import "./MovimentacaoesStyle.css";

// "Nova transação": no cabeçalho e, no modo extrato, no topo do card da tabela
const estiloBotaoPrincipal = {
  borderRadius: "10px",
  bgcolor: "var(--fnc-tx-destaque)",
  color: "var(--fnc-tx-sobre-destaque)",
  boxShadow: "none",
};

const gradeCards = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 2,
};

type TipoValor = "receita" | "despesa" | "neutro";

const corDoValor = (tipo: TipoValor, valor = 0) =>
  tipo === "receita"
    ? "var(--fnc-tx-receita)"
    : tipo === "despesa" || valor < 0
      ? "var(--fnc-tx-despesa)"
      : "var(--fnc-tx-texto)";

// parte de cada pendência (receitas ou despesas) no total pendente
const Progresso: React.FC<{
  valor: number;
  total: number;
  cor: string;
  rotulo: string;
}> = ({ valor, total, cor, rotulo }) => (
  <LinearProgress
    variant="determinate"
    value={total > 0 ? (valor / total) * 100 : 0}
    aria-label={rotulo}
    sx={{
      height: 6,
      borderRadius: 999,
      bgcolor: "var(--fnc-tx-trilho)",
      "& .MuiLinearProgress-bar": { bgcolor: cor, borderRadius: 999 },
    }}
  />
);

type ValorDetalhe = { rotulo: string; valor?: number; tipo: TipoValor };

// card de "Ver detalhes": vários valores lado a lado (receita, despesa ou neutro; neutro negativo em vermelho)
const CardDetalhe: React.FC<{
  rotulo: string;
  icone: string;
  corIcone: string;
  valores: ValorDetalhe[];
  ocultos: boolean;
}> = ({ rotulo, icone, corIcone, valores, ocultos }) => (
  <CardResumo rotulo={rotulo} icone={icone} corIcone={corIcone}>
    <Stack direction="row" sx={{ flexWrap: "wrap", gap: "6px 16px" }}>
      {valores.map(({ rotulo, valor, tipo }) => (
        <Box key={rotulo}>
          <Typography sx={{ fontSize: 12, color: "var(--fnc-tx-apoio)" }}>
            {rotulo}
          </Typography>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              lineHeight: 1.3,
              fontVariantNumeric: "tabular-nums",
              color: corDoValor(tipo, ocultos ? 0 : valor), // oculto: sem cor que entregue o sinal
            }}
          >
            {exibirMoeda(valor ?? 0, ocultos)}
          </Typography>
        </Box>
      ))}
    </Stack>
  </CardResumo>
);

// valor em destaque no rodapé da tabela
const ValorRodape: React.FC<{ rotulo: string; valor: string; cor: string }> = ({
  rotulo,
  valor,
  cor,
}) => (
  <span>
    {rotulo}:{" "}
    <Box
      component="strong"
      sx={{ fontVariantNumeric: "tabular-nums", color: cor }}
    >
      {valor}
    </Box>
  </span>
);

// valores iguais aos da URL (filtrosUrl.ts)

const Movimentacoes: React.FC = () => {
  const { conta, setConta, setContaUsuario, usuario } =
    useContext(ContaContext);
  const { user } = useContext(AuthContext);
  // a rota (ContaDaRota) só mostra esta tela com a conta carregada
  const contaAtual = conta!;
  const idConta = contaAtual.idConta;
  const idUsuario = user?.id;

  const [movimentacoes, setMovimentacoes] = useState<GetMovimentacoes>();
  // filtros da última busca que voltou: diferente dos atuais = a tabela está carregando
  const [filtrosCarregados, setFiltrosCarregados] = useState<string>();
  const [cadMovAberto, setCadMovAberto] = useState(false);
  const [conviteAberto, setConviteAberto] = useState(false);
  const [categoriasAberto, setCategoriasAberto] = useState(false);
  const { categorias, buscarCategorias } = useCategorias(idConta);

  // filtros na URL: recarregar ou compartilhar o link mantém o período, categorias, status e tipo
  const { filtros, alterarFiltros } = useFiltrosUrl();
  const {
    inicio: dataInicial,
    fim: dataFinal,
    categorias: categoriasSelecionadas,
    status,
    tipo,
  } = filtros;
  const [mostraDetalhes, setMostraDetalhes] = useState(false);
  const [busca, setBusca] = useState("");
  const { ocultos, alternarOcultos } = useValoresOcultos();
  const [modoSimples, setModoSimples] = useState(false);
  const [recarregando, setRecarregando] = useState(false);
  const ultimaBusca = useRef(0);

  const chaveFiltros = JSON.stringify([
    dataInicial,
    dataFinal,
    categoriasSelecionadas,
    status,
    tipo,
  ]);

  // atualiza saldos da conta (o card de resumo e a barra lateral leem do contexto)
  const buscarConta = useCallback(
    () =>
      buscarContas(idConta).then((resposta) => {
        if (resposta.sucesso && resposta.dados)
          setConta(resposta.dados.conteudo.contas[0]);
      }),
    [idConta, setConta],
  );

  const buscarUsuarioDaConta = useCallback(
    () =>
      buscarContaUsuario(idConta, idUsuario).then((resposta) => {
        if (resposta.sucesso && resposta.dados)
          setContaUsuario(resposta.dados.conteudo[0]);
      }),
    [idConta, idUsuario, setContaUsuario],
  );

  const buscarMovimentacoes = useCallback(() => {
    const busca = ++ultimaBusca.current;
    return buscarConta()
      .then(() =>
        Conecta<GetMovimentacoes>(rotaMovimentacoes(idConta, filtros), "GET"),
      )
      .then((resposta) => {
        // os filtros mudam na hora (datas, atalhos): resposta de uma busca antiga não sobrescreve a nova
        if (busca !== ultimaBusca.current) return;
        if (resposta.sucesso && resposta.dados)
          setMovimentacoes(resposta.dados);
        setFiltrosCarregados(chaveFiltros);
      });
  }, [buscarConta, idConta, filtros, chaveFiltros]);

  useEffect(() => {
    buscarUsuarioDaConta();
    buscarMovimentacoes();
  }, [buscarUsuarioDaConta, buscarMovimentacoes]);

  // Recém-cadastrada entra na tabela sem nova busca, se passar nos filtros atuais.
  // Saldos e cards de resumo só mudam ao recarregar (vêm prontos da API).
  const incluirNaTabela = (cadastrada: Movimentacao) => {
    if (!passaNosFiltros(cadastrada, filtros)) return;
    setMovimentacoes(
      (atual) =>
        atual && {
          ...atual,
          conteudo: {
            ...atual.conteudo,
            movimentacaos: [...atual.conteudo.movimentacaos, cadastrada],
          },
        },
    );
  };

  // botão de recarregar: busca de novo conta, permissões, categorias e movimentações
  const recarregar = () => {
    setRecarregando(true);
    Promise.all([
      buscarUsuarioDaConta(),
      buscarCategorias(),
      buscarMovimentacoes(),
    ]).finally(() => setRecarregando(false));
  };

  const resumo = movimentacoes?.conteudo.resumo;
  // busca por texto só na tela: a API não filtra texto
  const termo = normalizarNome(busca);
  const linhas = (movimentacoes?.conteudo.movimentacaos ?? []).filter(
    (mov) =>
      !termo ||
      normalizarNome(mov.titulo).includes(termo) ||
      normalizarNome(mov.observacao ?? "").includes(termo),
  );
  // soma das transações listadas: receitas menos despesas
  const saldoPeriodo = linhas.reduce(
    (soma, mov) => soma + (mov.tipo === 0 ? mov.valor : -mov.valor),
    0,
  );
  const totalPendente = contaAtual.entradaPendente + contaAtual.saidaPendente;
  const ehMestre = usuario?.permissao === PERMISSAO.Mestre;
  const podeEditar = usuario?.permissao !== PERMISSAO.Visualizador;
  const textoMaximizar = modoSimples ? "Restaurar" : "Maximizar (extrato)";

  // recarregar e maximizar: na barra da tabela e no rodapé do painel de filtros
  const botoesTela = (cor: string) => (
    <>
      <Tooltip title="Recarregar">
        <span>
          <IconButton
            aria-label="Recarregar"
            disabled={recarregando}
            sx={{ color: cor }}
            onClick={recarregar}
          >
            <Icon>refresh</Icon>
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={textoMaximizar}>
        <IconButton
          aria-label={textoMaximizar}
          aria-pressed={modoSimples}
          sx={{ color: cor }}
          // mantém os filtros: mudar qualquer um dispararia outra busca
          onClick={() => {
            // quem rola é o <main> do LayoutPrincipal (não a janela); ao maximizar, volta ao topo
            if (!modoSimples)
              document
                .querySelector("main")
                ?.scrollTo({ top: 0, behavior: "smooth" });
            setModoSimples(!modoSimples);
          }}
        >
          <Icon>{modoSimples ? "fullscreen_exit" : "fullscreen"}</Icon>
        </IconButton>
      </Tooltip>
    </>
  );

  return (
    <Stack
      className="transacoes-container"
      spacing={3}
      // ocupa a altura do <main>: o card da tabela fica com o resto e a página não rola
      // (sem o padding-bottom de .transacoes-container, que passaria da altura)
      sx={{ height: "100%", "&.transacoes-container": { pb: 0 } }}
    >
      {!modoSimples && (
        <>
          <Stack
            direction={{ xs: "column", md: "row" }}
            sx={{
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
              gap: 2,
            }}
          >
            <TituloPagina
              titulo={`Transações · ${contaAtual.titulo}`}
              subtitulo={
                <>
                  Acesso: {usuario && nomePermissao(usuario.permissao)}
                  {usuario?.expiracao &&
                    ` · Expiração: ${formatarDataHora(usuario.expiracao)}`}
                </>
              }
            />

            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5 }}>
              <BotaoOcultarValores
                ocultos={ocultos}
                onAlternar={alternarOcultos}
              />
              {podeEditar && ehMestre && (
                <Button
                  sx={{ ...estiloBotaoSecundario, px: 2.5 }}
                  onClick={() => setCategoriasAberto(true)}
                >
                  Categorias
                </Button>
              )}
              {podeEditar && (
                <Button
                  variant="contained"
                  startIcon={<Icon>add</Icon>}
                  onClick={() => setCadMovAberto(true)}
                  sx={{ ...estiloBotaoPrincipal, height: 44, px: 2.5 }}
                >
                  Nova transação
                </Button>
              )}
            </Stack>
          </Stack>

          <Box sx={gradeCards}>
            <CardResumo
              destaque
              rotulo="Saldo atual"
              valor={exibirMoeda(contaAtual.saldoAtual, ocultos)}
              icone="account_balance"
              corIcone="var(--fnc-tx-sobre-destaque)"
            >
              <Typography
                sx={{
                  fontSize: 13,
                  color: "var(--fnc-tx-legenda-destaque)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                Real e projetado da conta:{" "}
                {exibirMoeda(resumo?.saldoRealProjetado ?? 0, ocultos)}
              </Typography>
            </CardResumo>

            <CardResumo
              rotulo="Saldo projetado"
              valor={exibirMoeda(contaAtual.saldoProjetado, ocultos)}
              icone="query_stats"
              corIcone="var(--fnc-tx-destaque)"
              corValor={
                contaAtual.saldoProjetado < 0 && !ocultos
                  ? "var(--fnc-tx-despesa)"
                  : undefined
              }
            />

            <CardResumo
              rotulo="Receitas pendentes"
              valor={exibirMoeda(contaAtual.entradaPendente, ocultos)}
              icone="trending_up"
              corIcone="var(--fnc-tx-receita)"
              corValor="var(--fnc-tx-receita)"
            >
              <Progresso
                valor={contaAtual.entradaPendente}
                total={totalPendente}
                cor="var(--fnc-tx-receita-barra)"
                rotulo="Receitas no total pendente"
              />
            </CardResumo>

            <CardResumo
              rotulo="Despesas pendentes"
              valor={exibirMoeda(contaAtual.saidaPendente, ocultos)}
              icone="trending_down"
              corIcone="var(--fnc-tx-despesa)"
              corValor="var(--fnc-tx-despesa)"
            >
              <Progresso
                valor={contaAtual.saidaPendente}
                total={totalPendente}
                cor="var(--fnc-tx-despesa-barra)"
                rotulo="Despesas no total pendente"
              />
            </CardResumo>
          </Box>

          {mostraDetalhes && (
            <Box sx={gradeCards}>
              <CardDetalhe
                ocultos={ocultos}
                rotulo="Geral período"
                icone="swap_vert"
                corIcone="var(--fnc-tx-destaque)"
                valores={[
                  {
                    rotulo: "Entrada",
                    valor: resumo?.entrada.projetado,
                    tipo: "receita",
                  },
                  {
                    rotulo: "Saída",
                    valor: resumo?.saida.projetado,
                    tipo: "despesa",
                  },
                ]}
              />
              <CardDetalhe
                ocultos={ocultos}
                rotulo="Resto período"
                icone="account_balance_wallet"
                corIcone="var(--fnc-tx-destaque)"
                valores={[
                  {
                    rotulo: "Saldo",
                    valor: resumo?.saldoRealizado,
                    tipo: "receita",
                  },
                  {
                    rotulo: "Projetado",
                    valor: resumo?.saldoProjetado,
                    tipo: "neutro",
                  },
                ]}
              />
              <CardDetalhe
                ocultos={ocultos}
                rotulo="Entradas período"
                icone="trending_up"
                corIcone="var(--fnc-tx-receita)"
                valores={[
                  {
                    rotulo: "Realizadas",
                    valor: resumo?.entrada.concluidos,
                    tipo: "receita",
                  },
                  {
                    rotulo: "Projetado",
                    valor: resumo?.entrada.projetado,
                    tipo: "neutro",
                  },
                  {
                    rotulo: "Pendentes",
                    valor: resumo?.entrada.pendentes,
                    tipo: "despesa",
                  },
                ]}
              />
              <CardDetalhe
                ocultos={ocultos}
                rotulo="Saídas período"
                icone="trending_down"
                corIcone="var(--fnc-tx-despesa)"
                valores={[
                  {
                    rotulo: "Realizadas",
                    valor: resumo?.saida.concluidos,
                    tipo: "despesa",
                  },
                  {
                    rotulo: "Projetado",
                    valor: resumo?.saida.projetado,
                    tipo: "neutro",
                  },
                  {
                    rotulo: "Pendentes",
                    valor: resumo?.saida.pendentes,
                    tipo: "despesa",
                  },
                ]}
              />
            </Box>
          )}
        </>
      )}

      <Modal
        aberto={cadMovAberto}
        titulo="Nova transação"
        onClose={() => setCadMovAberto(false)}
      >
        <CadMov
          onClose={(cadastrada) => {
            setCadMovAberto(false);
            if (cadastrada) incluirNaTabela(cadastrada);
            else buscarMovimentacoes();
          }}
        />
      </Modal>

      <Modal
        aberto={categoriasAberto}
        titulo="Categorias"
        onClose={() => {
          setCategoriasAberto(false);
          buscarCategorias();
        }}
      >
        <Categorias
          idConta={idConta}
          buscaMovimentacoes={buscarMovimentacoes}
        />
      </Modal>

      <Modal
        aberto={conviteAberto}
        titulo="Novo convite"
        onClose={() => setConviteAberto(false)}
      >
        {/* o botão só aparece para o mestre desta conta: ela já vem escolhida */}
        <CadConvite
          contas={[contaAtual]}
          idContaInicial={idConta}
          onClose={() => setConviteAberto(false)}
        />
      </Modal>

      {/* card da tabela: filtros no topo, tabela e rodapé com o total do período.
          Vidro fosco: superfície translúcida que desfoca o fundo atrás dela. */}
      <Box
        sx={{
          bgcolor:
            "color-mix(in srgb, var(--fnc-tx-superficie) 55%, transparent)",
          backdropFilter: "blur(16px) saturate(140%)",
          border: "1px solid var(--fnc-tx-borda)",
          borderRadius: "16px",
          overflow: "hidden",
          // preenche o que sobra da tela (a tabela rola por dentro); em tela baixa ou com os
          // detalhes abertos fica com no mínimo 360px, e aí a página rola
          display: "flex",
          flexDirection: "column",
          flex: "1 0 360px",
        }}
      >
        {/* no extrato o cabeçalho some: o botão de nova transação vai para o topo do card,
            com o fundo da barra de filtros logo abaixo (parecem uma área só) */}
        {modoSimples && podeEditar && (
          <Stack
            sx={{
              alignItems: "flex-end",
              px: 2.5,
              pt: 1.5,
              bgcolor:
                "color-mix(in srgb, var(--fnc-tx-barra-filtros) 60%, transparent)",
            }}
          >
            <Button
              variant="contained"
              startIcon={<Icon>add</Icon>}
              onClick={() => setCadMovAberto(true)}
              sx={{ ...estiloBotaoPrincipal, height: 36, px: 2 }}
            >
              Nova transação
            </Button>
          </Stack>
        )}
        <TabelaMovimentacao
          ocultarValores={ocultos}
          movimentacao={
            movimentacoes && {
              ...movimentacoes,
              conteudo: { ...movimentacoes.conteudo, movimentacaos: linhas },
            }
          }
          carregando={recarregando || filtrosCarregados !== chaveFiltros}
          buscaMovimentacoes={buscarMovimentacoes}
          filtros={
            <>
              <FiltrosConta
                categorias={categorias}
                filtros={filtros}
                alterarFiltros={alterarFiltros}
                busca={busca}
                setBusca={setBusca}
                rodape={
                  <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
                    {botoesTela("inherit")}
                  </Stack>
                }
              />
              {/* no extrato os detalhes não aparecem (o cabeçalho some) */}
              {!modoSimples && (
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={mostraDetalhes}
                      onChange={(e) => setMostraDetalhes(e.target.checked)}
                    />
                  }
                  label="Ver detalhes"
                  sx={{
                    height: 36,
                    ml: 0,
                    mr: 1,
                    color: "var(--fnc-tx-texto)",
                    "& .MuiFormControlLabel-label": { fontSize: 14 },
                    // celular: fica na linha de baixo, à esquerda, com os ícones à direita
                    [`@media ${CONSULTA_CELULAR}`]: { flexGrow: 1 },
                  }}
                />
              )}
            </>
          }
          // recarregar e maximizar no mesmo grupo dos ícones da tabela: ficam sempre na mesma linha
          acoes={botoesTela("var(--fnc-tx-texto)")}
        />

        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
            px: 2.5,
            py: 2,
            borderTop: "1px solid var(--fnc-tx-divisoria)",
            fontSize: 13,
            color: "var(--fnc-tx-apoio)",
          }}
        >
          <span>
            {linhas.length} {linhas.length === 1 ? "transação" : "transações"}
          </span>
          {modoSimples ? (
            <>
              <ValorRodape
                rotulo="Gastos no período"
                valor={exibirMoeda(resumo?.saida.projetado ?? 0, ocultos)}
                cor="var(--fnc-tx-despesa)"
              />
              <ValorRodape
                rotulo="Saldo atual"
                valor={exibirMoeda(contaAtual.saldoAtual, ocultos)}
                cor="var(--fnc-tx-texto)"
              />
            </>
          ) : (
            <ValorRodape
              rotulo="Saldo do período"
              valor={valorComSinal(saldoPeriodo, ocultos)}
              cor={
                ocultos
                  ? "var(--fnc-tx-texto)"
                  : saldoPeriodo < 0
                    ? "var(--fnc-tx-despesa)"
                    : "var(--fnc-tx-receita)"
              }
            />
          )}
        </Stack>
      </Box>
    </Stack>
  );
};

export default Movimentacoes;
