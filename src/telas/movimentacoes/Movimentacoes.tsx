import { useCallback, useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Icon,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import Conecta from "../../services/api/apiConnect";
import { buscarContaUsuario } from "../../services/contas/contaUsuarioService";
import type {
  Categoria,
  GetMovimentacoes,
} from "../../models/movimentacoes/GetMovimentacoes";
import type { ContaResponse } from "../../models/contas-usuarios/GetContasBancarias";
import { ContaContext } from "../../contexts/ContaContext";
import { AuthContext } from "../../contexts/AuthContext";
import { useCategorias } from "../../hooks/useCategorias";
import Modal from "../../componentes/modal/Modal";
import TituloPagina from "../../componentes/titulo-pagina/TituloPagina";
import CheckBoxList from "../../props/check-box-list/CheckBoxList";
import InputCheckBox from "../../props/input-check-box/InputCheckBox";
import Categorias from "../categorias/Categorias";
import FiltroPeriodo from "./filtro-periodo/FiltroPeriodo";
import CadMov from "./cad-mov/CadMov";
import CadConvite from "./cad-convite/CadConvite";
import TabelaMovimentacao from "./tabela/TabelaMovimentacao";
import CardResumo from "./card-resumo/CardResumo";
import { ChipFiltro, ChipSelect } from "./filtros/ChipFiltro";
import {
  formatarDataHora,
  formatarMoeda,
  periodoDoMes,
  valorComSinal,
} from "../../utils/formatacao";
import { nomePermissao, PERMISSAO } from "../../utils/permissao";
import { estiloBotaoSecundario } from "../../estilos";
import "./MovimentacaoesStyle.css";

const SEM_CATEGORIA: Categoria = { idCategoria: 0, nome: "Sem categoria", cor: "" };

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
}> = ({ rotulo, icone, corIcone, valores }) => (
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
              color: corDoValor(tipo, valor),
            }}
          >
            {formatarMoeda(valor)}
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

const OPCOES_STATUS = [
  { rotulo: "Todas", valor: "Todas" },
  { rotulo: "Pendente", valor: "Pendente" },
  { rotulo: "Concluído", valor: "Concluido" },
];
const OPCOES_TIPO = [
  { rotulo: "Todas", valor: "Todas" },
  { rotulo: "Entrada", valor: "0" },
  { rotulo: "Saída", valor: "1" },
];

// "YYYY-MM-DDTHH:mm" local enviado como se fosse UTC: a API compara com o horário local gravado
const paraUtcSemFuso = (data: string) => {
  const local = new Date(data);
  return new Date(
    local.getTime() - local.getTimezoneOffset() * 60 * 1000,
  ).toISOString();
};

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

  const [dataInicial, setDataInicial] = useState(() => periodoDoMes().inicio);
  const [dataFinal, setDataFinal] = useState(() => periodoDoMes().fim);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<
    number[]
  >([]);
  const [status, setStatus] = useState("Todas");
  const [tipo, setTipo] = useState("Todas");
  const [mostraDetalhes, setMostraDetalhes] = useState(false);
  const [modoSimples, setModoSimples] = useState(false);

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
      Conecta<ContaResponse>(`/ContasUsuarios?id=${idConta}`, "GET").then(
        (resposta) => {
          if (resposta.sucesso && resposta.dados)
            setConta(resposta.dados.conteudo.contas[0]);
        },
      ),
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
    const parametros = new URLSearchParams({
      DthrMovimentacaoInicial: paraUtcSemFuso(dataInicial),
      DthrMovimentacaoFinal: paraUtcSemFuso(dataFinal),
    });
    categoriasSelecionadas.forEach((id) =>
      parametros.append("IdCategoria", String(id)),
    );
    if (status !== "Todas")
      parametros.append("Concluido", String(status === "Concluido"));
    if (tipo !== "Todas") parametros.append("TipoMovimentacao", tipo);
    parametros.append("RetornaFixos", "true");

    return buscarConta()
      .then(() =>
        Conecta<GetMovimentacoes>(
          `/Contas/${idConta}/Movimentacoes/Retornar?${parametros}`,
          "GET",
        ),
      )
      .then((resposta) => {
        if (resposta.sucesso && resposta.dados)
          setMovimentacoes(resposta.dados);
        setFiltrosCarregados(chaveFiltros);
      });
  }, [
    buscarConta,
    idConta,
    dataInicial,
    dataFinal,
    categoriasSelecionadas,
    status,
    tipo,
    chaveFiltros,
  ]);

  useEffect(() => {
    buscarUsuarioDaConta();
    buscarMovimentacoes();
  }, [buscarUsuarioDaConta, buscarMovimentacoes]);

  const resumo = movimentacoes?.conteudo.resumo;
  const linhas = movimentacoes?.conteudo.movimentacaos ?? [];
  // soma das transações listadas: receitas menos despesas
  const saldoPeriodo = linhas.reduce(
    (soma, mov) => soma + (mov.tipo === 0 ? mov.valor : -mov.valor),
    0,
  );
  const totalPendente = contaAtual.entradaPendente + contaAtual.saidaPendente;
  const ehMestre = usuario?.permissao === PERMISSAO.Mestre;
  const podeEditar = usuario?.permissao !== PERMISSAO.Visualizador;
  const textoMaximizar = modoSimples ? "Restaurar" : "Maximizar (extrato)";

  return (
    <Stack className="transacoes-container" spacing={3}>
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

            {podeEditar && (
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5 }}>
                {ehMestre && (
                  <>
                    <Button
                      sx={{ ...estiloBotaoSecundario, px: 2.5 }}
                      onClick={() => setCategoriasAberto(true)}
                    >
                      Categorias
                    </Button>
                    <Button
                      sx={{ ...estiloBotaoSecundario, px: 2.5 }}
                      onClick={() => setConviteAberto(true)}
                    >
                      Novo convite
                    </Button>
                  </>
                )}
                <Button
                  variant="contained"
                  startIcon={<Icon>add</Icon>}
                  onClick={() => setCadMovAberto(true)}
                  sx={{
                    height: 44,
                    px: 2.5,
                    borderRadius: "10px",
                    bgcolor: "var(--fnc-tx-destaque)",
                    color: "var(--fnc-tx-sobre-destaque)",
                    boxShadow: "none",
                  }}
                >
                  Nova transação
                </Button>
              </Stack>
            )}
          </Stack>

          <Box sx={gradeCards}>
            <CardResumo
              destaque
              rotulo="Saldo atual"
              valor={formatarMoeda(contaAtual.saldoAtual)}
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
                {formatarMoeda(resumo?.saldoRealProjetado)}
              </Typography>
            </CardResumo>

            <CardResumo
              rotulo="Saldo projetado"
              valor={formatarMoeda(contaAtual.saldoProjetado)}
              icone="query_stats"
              corIcone="var(--fnc-tx-destaque)"
              corValor={
                contaAtual.saldoProjetado < 0
                  ? "var(--fnc-tx-despesa)"
                  : undefined
              }
            />

            <CardResumo
              rotulo="Receitas pendentes"
              valor={formatarMoeda(contaAtual.entradaPendente)}
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
              valor={formatarMoeda(contaAtual.saidaPendente)}
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
                rotulo="Geral período"
                icone="swap_vert"
                corIcone="var(--fnc-tx-destaque)"
                valores={[
                  { rotulo: "Entrada", valor: resumo?.entrada.projetado, tipo: "receita" },
                  { rotulo: "Saída", valor: resumo?.saida.projetado, tipo: "despesa" },
                ]}
              />
              <CardDetalhe
                rotulo="Resto período"
                icone="account_balance_wallet"
                corIcone="var(--fnc-tx-destaque)"
                valores={[
                  { rotulo: "Saldo", valor: resumo?.saldoRealizado, tipo: "receita" },
                  { rotulo: "Projetado", valor: resumo?.saldoProjetado, tipo: "neutro" },
                ]}
              />
              <CardDetalhe
                rotulo="Entradas período"
                icone="trending_up"
                corIcone="var(--fnc-tx-receita)"
                valores={[
                  { rotulo: "Realizadas", valor: resumo?.entrada.concluidos, tipo: "receita" },
                  { rotulo: "Projetado", valor: resumo?.entrada.projetado, tipo: "neutro" },
                  { rotulo: "Pendentes", valor: resumo?.entrada.pendentes, tipo: "despesa" },
                ]}
              />
              <CardDetalhe
                rotulo="Saídas período"
                icone="trending_down"
                corIcone="var(--fnc-tx-despesa)"
                valores={[
                  { rotulo: "Realizadas", valor: resumo?.saida.concluidos, tipo: "despesa" },
                  { rotulo: "Projetado", valor: resumo?.saida.projetado, tipo: "neutro" },
                  { rotulo: "Pendentes", valor: resumo?.saida.pendentes, tipo: "despesa" },
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
          onClose={() => {
            setCadMovAberto(false);
            buscarMovimentacoes();
            buscarUsuarioDaConta();
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
        <Categorias idConta={idConta} buscaMovimentacoes={buscarMovimentacoes} />
      </Modal>

      <Modal
        aberto={conviteAberto}
        titulo="Novo convite"
        onClose={() => setConviteAberto(false)}
      >
        <CadConvite onClose={() => setConviteAberto(false)} />
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
        }}
      >
        <TabelaMovimentacao
          movimentacao={movimentacoes}
          carregando={filtrosCarregados !== chaveFiltros}
          buscaMovimentacoes={buscarMovimentacoes}
          filtros={
            <Stack
              direction="row"
              sx={{
                flex: 1,
                minWidth: 0,
                flexWrap: "wrap",
                // pelo pé: os campos de data têm rótulo em cima, os chips não
                alignItems: "flex-end",
                // na mesma linha, filtros à direita; quebrando, a linha de baixo começa à esquerda
                justifyContent: "space-between",
                gap: 1.5,
              }}
            >
              <FiltroPeriodo
                dataInicial={dataInicial}
                setDataInicial={setDataInicial}
                dataFinal={dataFinal}
                setDataFinal={setDataFinal}
              />
              {!modoSimples && (
                <Stack
                  direction="row"
                  sx={{ flexWrap: "wrap", alignItems: "center", gap: 1 }}
                >
                  <CheckBoxList<Categoria>
                    itens={[SEM_CATEGORIA, ...categorias]}
                    chaveId="idCategoria"
                    chaveTexto="nome"
                    selecionados={categoriasSelecionadas}
                    setSelecionados={setCategoriasSelecionadas}
                    rotulo="Categorias"
                    ignorarPrimeiroItem
                    gatilho={({ abrir, aberto, resumo }) => (
                      <ChipFiltro
                        texto={resumo ? `Categorias: ${resumo}` : "Categorias"}
                        aberto={aberto}
                        onClick={abrir}
                      />
                    )}
                  />
                  {/* juntos: quando a linha quebra, Status e Tipo descem lado a lado */}
                  <Stack direction="row" sx={{ gap: 1 }}>
                    <ChipSelect
                      rotulo="Status"
                      opcoes={OPCOES_STATUS}
                      valor={status}
                      setValor={setStatus}
                    />
                    <ChipSelect
                      rotulo="Tipo"
                      opcoes={OPCOES_TIPO}
                      valor={tipo}
                      setValor={setTipo}
                    />
                  </Stack>
                </Stack>
              )}

              {/* margem automática: sempre à direita, mesmo quando a linha quebra;
                  no celular a linha é inteira: "Ver detalhes" à esquerda, maximizar à direita */}
              <Stack
                direction="row"
                sx={{
                  ml: "auto",
                  width: { xs: "100%", sm: "auto" },
                  justifyContent: "flex-end",
                  height: 36,
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {!modoSimples && (
                  <Box
                    sx={{
                      color: "var(--fnc-tx-texto)",
                      pl: { xs: 0, sm: 1 },
                      mr: { xs: "auto", sm: 0 },
                    }}
                  >
                    <InputCheckBox
                      rotulo="Ver detalhes"
                      marcado={mostraDetalhes}
                      setMarcado={setMostraDetalhes}
                    />
                  </Box>
                )}

                <Tooltip title={textoMaximizar}>
                  <IconButton
                    aria-label={textoMaximizar}
                    aria-pressed={modoSimples}
                    sx={{ color: "var(--fnc-tx-texto)" }}
                    // mantém os filtros: mudar qualquer um dispararia outra busca
                    onClick={() => setModoSimples(!modoSimples)}
                  >
                    <Icon>
                      {modoSimples ? "fullscreen_exit" : "fullscreen"}
                    </Icon>
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          }
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
                valor={formatarMoeda(resumo?.saida.projetado)}
                cor="var(--fnc-tx-despesa)"
              />
              <ValorRodape
                rotulo="Saldo atual"
                valor={formatarMoeda(contaAtual.saldoAtual)}
                cor="var(--fnc-tx-texto)"
              />
            </>
          ) : (
            <ValorRodape
              rotulo="Saldo do período"
              valor={valorComSinal(saldoPeriodo)}
              cor={
                saldoPeriodo < 0
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
