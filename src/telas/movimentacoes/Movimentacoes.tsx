import api from "../../services/api/apiConnect";
import "./MovimentacaoesStyle.css";
import { useCallback, useContext, useEffect, useState } from "react";
import type {
  Categoria,
  GetMovimentacoes,
} from "../../models/movimentacoes/GetMovimentacoes";
import Modal from "../../componentes/modal/Modal";
import type { CategoriaResponse } from "../../models/categorias/Categorias";
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
import Categorias from "../categorias/Categorias";
import FiltroPeriodo from "./filtro-periodo/FiltroPeriodo";
import CheckBoxList from "../../props/check-box-list/CheckBoxList";
import { ContaContext } from "../../contexts/ContaContext";
import CadMov from "./cad-mov/CadMov";
import TabelaMovimentacao from "./tabela/TabelaMovimentacao";
import { AuthContext } from "../../contexts/AuthContext";
import CadConvite from "./cad-convite/CadConvite";
import type { GetContaUsuario } from "../../models/contas-usuarios/GetContaUsuario";
import type { ContaResponse } from "../../models/contas-usuarios/GetContasBancarias";
import InputCheckBox from "../../props/input-check-box/InputCheckBox";
import CardResumo from "./card-resumo/CardResumo";
import { ChipFiltro, ChipSelect } from "./filtros/ChipFiltro";
import { valorComSinal } from "../../utils/formatacao";

const botaoSecundario = {
  height: 44,
  px: 2.5,
  borderRadius: "10px",
  bgcolor: "var(--fnc-tx-superficie)",
  border: "1px solid var(--fnc-tx-botao-borda)",
  color: "var(--fnc-tx-chip-texto)",
  "&:hover": { bgcolor: "var(--fnc-tx-chip-fundo)" },
};

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

// valor de um card de "Ver detalhes": as mesmas cores de antes (receita, despesa ou neutro; neutro negativo em vermelho)
const ValorDetalhe: React.FC<{
  rotulo: string;
  valor: number | undefined;
  tipo: "receita" | "despesa" | "neutro";
  formata: (valor: number | undefined) => string;
}> = ({ rotulo, valor, tipo, formata }) => (
  <Box>
    <Typography sx={{ fontSize: 12, color: "var(--fnc-tx-apoio)" }}>
      {rotulo}
    </Typography>
    <Typography
      sx={{
        fontSize: 16,
        fontWeight: 700,
        lineHeight: 1.3,
        fontVariantNumeric: "tabular-nums",
        color:
          tipo === "receita"
            ? "var(--fnc-tx-receita)"
            : tipo === "despesa" || (valor ?? 0) < 0
              ? "var(--fnc-tx-despesa)"
              : "var(--fnc-tx-texto)",
      }}
    >
      {formata(valor)}
    </Typography>
  </Box>
);

const Movimentacoes: React.FC = () => {
  const { conta, setConta, setContaUsuario, usuario } =
    useContext(ContaContext);
  const { user } = useContext(AuthContext);
  // a rota (ContaDaRota) só mostra esta tela com a conta carregada
  const idConta = conta!.idConta;
  const idUsuario = user?.id;
  const [movimentacoes, setMovimentacoes] = useState<GetMovimentacoes>();
  // filtros da última busca que voltou: diferente dos atuais = a tabela está carregando
  const [filtrosCarregados, setFiltrosCarregados] = useState<string>();
  const [isCadMovOpen, setIsCadMovOpen] = useState(false);
  const [isCadInvite, setIsCadInvite] = useState(false);

  const [categorias, setCategorias] = useState<CategoriaResponse>();
  const [isCategoriaOpen, setIsCategoriaOpen] = useState(false);
  const [isConcluido, setIsConcluido] = useState<boolean | null>(null);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<number | null>(null);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<
    number[]
  >([]);

  const [mostraResumo, setmostraResumo] = useState<boolean>(false);
  const [modoSimples, setModoSimples] = useState(false);
  const [statusSelect, setStatusSelect] = useState("Todas");

  const getNow = (isEnd: boolean = false) => {
    const now = new Date();
    let date: Date;

    if (!isEnd) {
      date = new Date(now.getFullYear(), now.getMonth(), 1);
      date.setHours(0, 0, 0, 0);
    } else {
      date = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      date.setHours(23, 59, 59, 999);
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const [dataInicial, setDataInicial] = useState(getNow(false));
  const [dataFinal, setDataFinal] = useState(getNow(true));

  const formataMoeda = (valor: number | undefined) => {
    if (valor === undefined) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  // atualiza saldos da conta (o card de resumo e a barra lateral leem do contexto)
  const buscaContas = useCallback(
    () =>
      api<ContaResponse>(`/ContasUsuarios?id=${idConta}`, "GET").then(
        (resposta) => {
          if (resposta.sucesso && resposta.dados)
            setConta(resposta.dados.conteudo.contas[0]);
        },
      ),
    [idConta, setConta],
  );

  // Conecta nunca lança erro: falhas vêm em resposta.sucesso
  const buscaCategorias = useCallback(
    () =>
      api<CategoriaResponse>(`/Contas/${idConta}/Categorias`, "GET").then(
        (resposta) => {
          if (resposta.sucesso && resposta.dados) setCategorias(resposta.dados);
        },
      ),
    [idConta],
  );

  const buscaContaUsuario = useCallback(
    () =>
      api<GetContaUsuario>(
        `/ContasUsuarios/${idConta}/associados?IdUsuario=${idUsuario}`,
        "GET",
      ).then((resposta) => {
        if (resposta.sucesso && resposta.dados)
          setContaUsuario(resposta.dados.conteudo[0]);
      }),
    [idConta, idUsuario, setContaUsuario],
  );

  const formatarData = (dataUtc: string) => {
    const data = new Date(dataUtc);

    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const ano = data.getFullYear();

    const hora = String(data.getHours()).padStart(2, "0");
    const min = String(data.getMinutes()).padStart(2, "0");

    return `${dia}/${mes}/${ano} ${hora}:${min}`;
  };

  const buscaMovimentacoes = useCallback(() => {
    const toUTCISOString = (data: string) => {
      const local = new Date(data);
      const offsetMs = local.getTimezoneOffset() * 60 * 1000;
      return new Date(local.getTime() - offsetMs).toISOString();
    };

    const params = new URLSearchParams({
      DthrMovimentacaoInicial: toUTCISOString(dataInicial),
      DthrMovimentacaoFinal: toUTCISOString(dataFinal),
    });

    categoriasSelecionadas.forEach((cat) => {
      params.append("IdCategoria", cat.toString());
    });

    if (isConcluido !== null) {
      params.append("Concluido", isConcluido.toString());
    }

    if (tipoMovimentacao !== null) {
      params.append("TipoMovimentacao", tipoMovimentacao.toString());
    }

    params.append("RetornaFixos", "true");

    const url = `/Contas/${idConta}/Movimentacoes/Retornar?${params.toString()}`;

    const filtros = JSON.stringify([
      dataInicial,
      dataFinal,
      categoriasSelecionadas,
      isConcluido,
      tipoMovimentacao,
    ]);
    return buscaContas()
      .then(() => api<GetMovimentacoes>(url, "GET"))
      .then((resposta) => {
        if (resposta.sucesso && resposta.dados)
          setMovimentacoes(resposta.dados);
        setFiltrosCarregados(filtros);
      });
  }, [
    buscaContas,
    idConta,
    dataInicial,
    dataFinal,
    categoriasSelecionadas,
    isConcluido,
    tipoMovimentacao,
  ]);

  useEffect(() => {
    buscaContaUsuario();
    buscaCategorias();
    buscaMovimentacoes();
  }, [buscaContaUsuario, buscaCategorias, buscaMovimentacoes]);

  const carregandoMov =
    filtrosCarregados !==
    JSON.stringify([
      dataInicial,
      dataFinal,
      categoriasSelecionadas,
      isConcluido,
      tipoMovimentacao,
    ]);
  const resumo = movimentacoes?.conteudo.resumo;
  const linhas = movimentacoes?.conteudo.movimentacaos ?? [];
  // soma das transações listadas: receitas menos despesas
  const saldoPeriodo = linhas.reduce(
    (soma, mov) => soma + (mov.tipo === 0 ? mov.valor : -mov.valor),
    0,
  );
  const totalPendente = conta!.entradaPendente + conta!.saidaPendente;
  const nivelAcesso =
    usuario?.permissao === 0
      ? "Mestre"
      : usuario?.permissao === 1
        ? "Administrador"
        : "Visualizador";

  return (
    <Stack className="transacoes-container" spacing={3}>
      {!modoSimples && (
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--fnc-tx-texto)",
            }}
          >
            Transações · {conta!.titulo}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "var(--fnc-tx-apoio)" }}>
            Acesso: {nivelAcesso}
            {usuario?.expiracao &&
              ` · Expiração: ${formatarData(usuario.expiracao)}`}
          </Typography>
        </Box>

        {usuario?.permissao !== 2 && (
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5 }}>
            {usuario?.permissao === 0 && (
              <>
                <Button
                  sx={botaoSecundario}
                  onClick={() => setIsCategoriaOpen(true)}
                >
                  Categorias
                </Button>
                <Button
                  sx={botaoSecundario}
                  onClick={() => setIsCadInvite(true)}
                >
                  Novo convite
                </Button>
              </>
            )}
            <Button
              variant="contained"
              startIcon={<Icon>add</Icon>}
              onClick={() => setIsCadMovOpen(true)}
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
      )}

      {!modoSimples && (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 2,
        }}
      >
        <CardResumo
          destaque
          rotulo="Saldo atual"
          valor={formataMoeda(conta!.saldoAtual)}
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
            {formataMoeda(resumo?.saldoRealProjetado)}
          </Typography>
        </CardResumo>

        <CardResumo
          rotulo="Saldo projetado"
          valor={formataMoeda(conta!.saldoProjetado)}
          icone="query_stats"
          corIcone="var(--fnc-tx-destaque)"
          corValor={
            conta!.saldoProjetado < 0 ? "var(--fnc-tx-despesa)" : undefined
          }
        >
   
        </CardResumo>

        <CardResumo
          rotulo="Receitas pendentes"
          valor={formataMoeda(conta!.entradaPendente)}
          icone="trending_up"
          corIcone="var(--fnc-tx-receita)"
          corValor="var(--fnc-tx-receita)"
        >
          <Progresso
            valor={conta!.entradaPendente}
            total={totalPendente}
            cor="var(--fnc-tx-receita-barra)"
            rotulo="Receitas no total pendente"
          />
        </CardResumo>

        <CardResumo
          rotulo="Despesas pendentes"
          valor={formataMoeda(conta!.saidaPendente)}
          icone="trending_down"
          corIcone="var(--fnc-tx-despesa)"
          corValor="var(--fnc-tx-despesa)"
        >
          <Progresso
            valor={conta!.saidaPendente}
            total={totalPendente}
            cor="var(--fnc-tx-despesa-barra)"
            rotulo="Despesas no total pendente"
          />
        </CardResumo>
      </Box>
      )}

      {mostraResumo && !modoSimples && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 2,
          }}
        >
          <CardResumo
            rotulo="Geral período"
            icone="swap_vert"
            corIcone="var(--fnc-tx-destaque)"
          >
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: "6px 16px" }}>
              <ValorDetalhe
                rotulo="Entrada"
                valor={resumo?.entrada.projetado}
                tipo="receita"
                formata={formataMoeda}
              />
              <ValorDetalhe
                rotulo="Saída"
                valor={resumo?.saida.projetado}
                tipo="despesa"
                formata={formataMoeda}
              />
            </Stack>
          </CardResumo>
          <CardResumo
            rotulo="Resto período"
            icone="account_balance_wallet"
            corIcone="var(--fnc-tx-destaque)"
          >
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: "6px 16px" }}>
              <ValorDetalhe
                rotulo="Saldo"
                valor={resumo?.saldoRealizado}
                tipo="receita"
                formata={formataMoeda}
              />
              <ValorDetalhe
                rotulo="Projetado"
                valor={resumo?.saldoProjetado}
                tipo="neutro"
                formata={formataMoeda}
              />
            </Stack>
          </CardResumo>
          <CardResumo
            rotulo="Entradas período"
            icone="trending_up"
            corIcone="var(--fnc-tx-receita)"
          >
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: "6px 16px" }}>
              <ValorDetalhe
                rotulo="Realizadas"
                valor={resumo?.entrada.concluidos}
                tipo="receita"
                formata={formataMoeda}
              />
              <ValorDetalhe
                rotulo="Projetado"
                valor={resumo?.entrada.projetado}
                tipo="neutro"
                formata={formataMoeda}
              />
              <ValorDetalhe
                rotulo="Pendentes"
                valor={resumo?.entrada.pendentes}
                tipo="despesa"
                formata={formataMoeda}
              />
            </Stack>
          </CardResumo>
          <CardResumo
            rotulo="Saídas período"
            icone="trending_down"
            corIcone="var(--fnc-tx-despesa)"
          >
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: "6px 16px" }}>
              <ValorDetalhe
                rotulo="Realizadas"
                valor={resumo?.saida.concluidos}
                tipo="despesa"
                formata={formataMoeda}
              />
              <ValorDetalhe
                rotulo="Projetado"
                valor={resumo?.saida.projetado}
                tipo="neutro"
                formata={formataMoeda}
              />
              <ValorDetalhe
                rotulo="Pendentes"
                valor={resumo?.saida.pendentes}
                tipo="despesa"
                formata={formataMoeda}
              />
            </Stack>
          </CardResumo>
        </Box>
      )}

      <Modal isOpen={isCadMovOpen} onClose={() => setIsCadMovOpen(false)}>
        <CadMov
          onClose={() => {
            setIsCadMovOpen(false);
            buscaMovimentacoes();
            buscaContaUsuario();
          }}
        />
      </Modal>

      <Modal
        isOpen={isCategoriaOpen}
        titulo="Categorias"
        onClose={async () => {
          {
            setIsCategoriaOpen(false);
            await buscaCategorias();
          }
        }}
      >
        <Categorias
          idConta={conta!.idConta}
          buscaMovimentacoes={buscaMovimentacoes}
        />
      </Modal>

      <Modal
        isOpen={isCadInvite}
        onClose={() => {
          setIsCadInvite(false);
        }}
      >
        <CadConvite setIsCadInvite={setIsCadInvite} />
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
          carregando={carregandoMov}
          buscaMovimentacoes={buscaMovimentacoes}
          idConta={conta!.idConta}
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
                sx={{
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CheckBoxList<Categoria>
                  itens={[
                    {
                      idCategoria: 0,
                      nome: "Sem categoria",
                    } as Categoria,

                    ...(categorias?.conteudo ?? []),
                  ]}
                  idKey="idCategoria"
                  labelKey="nome"
                  selecionados={categoriasSelecionadas}
                  onChange={setCategoriasSelecionadas}
                  label="Categorias"
                  ignorarPrimeiroItem={true}
                  gatilho={({ abrir, aberto, resumo }) => (
                    <ChipFiltro
                      texto={resumo ? `Categorias: ${resumo}` : "Categorias"}
                      aberto={aberto}
                      onClick={abrir}
                    />
                  )}
                />

                <ChipSelect
                  rotulo="Status"
                  opcoes={[
                    { label: "Todas", value: "Todas" },
                    { label: "Pendente", value: "Pendente" },
                    { label: "Concluído", value: "Concluido" },
                  ]}
                  valor={statusSelect}
                  onChange={(valor) => {
                    setStatusSelect(valor);

                    setIsConcluido(
                      valor === "Todas"
                        ? null
                        : valor === "Pendente"
                          ? false
                          : true,
                    );
                  }}
                />

                <ChipSelect
                  rotulo="Tipo"
                  opcoes={[
                    { label: "Todas", value: "Todas" },
                    { label: "Entrada", value: "Entrada" },
                    { label: "Saída", value: "Saida" },
                  ]}
                  onChange={(valor) =>
                    setTipoMovimentacao(
                      valor === "Todas" ? null : valor === "Entrada" ? 0 : 1,
                    )
                  }
                  valor={
                    tipoMovimentacao === null
                      ? "Todas"
                      : tipoMovimentacao === 0
                        ? "Entrada"
                        : "Saida"
                  }
                />
              </Stack>
              )}

              {/* margem automática: sempre à direita, mesmo quando a linha quebra */}
              <Stack
                direction="row"
                sx={{ ml: "auto", height: 36, alignItems: "center", gap: 1 }}
              >
                {!modoSimples && (
                  <Box sx={{ color: "var(--fnc-tx-texto)", pl: 1 }}>
                    <InputCheckBox
                      label="Ver detalhes"
                      setChecked={() => setmostraResumo(!mostraResumo)}
                      checked={mostraResumo}
                    />
                  </Box>
                )}

                <Tooltip title={modoSimples ? "Restaurar" : "Maximizar (extrato)"}>
                  <IconButton
                    aria-label={modoSimples ? "Restaurar" : "Maximizar (extrato)"}
                    aria-pressed={modoSimples}
                    sx={{ color: "var(--fnc-tx-texto)" }}
                    // mantém os filtros: mudar qualquer um dispararia outra busca
                    onClick={() => setModoSimples(!modoSimples)}
                  >
                    <Icon>{modoSimples ? "fullscreen_exit" : "fullscreen"}</Icon>
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
              <span>
                Gastos no período:{" "}
                <Box
                  component="strong"
                  sx={{
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--fnc-tx-despesa)",
                  }}
                >
                  {formataMoeda(resumo?.saida.projetado)}
                </Box>
              </span>
              <span>
                Saldo atual:{" "}
                <Box
                  component="strong"
                  sx={{
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--fnc-tx-texto)",
                  }}
                >
                  {formataMoeda(conta!.saldoAtual)}
                </Box>
              </span>
            </>
          ) : (
          <span>
            Saldo do período:{" "}
            <Box
              component="strong"
              sx={{
                fontVariantNumeric: "tabular-nums",
                color:
                  saldoPeriodo < 0
                    ? "var(--fnc-tx-despesa)"
                    : "var(--fnc-tx-receita)",
              }}
            >
              {valorComSinal(saldoPeriodo)}
            </Box>
          </span>
          )}
        </Stack>
      </Box>
    </Stack>
  );
};

export default Movimentacoes;
