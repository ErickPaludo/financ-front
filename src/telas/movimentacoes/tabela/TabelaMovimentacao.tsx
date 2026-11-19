import { useMemo, useState, type Key, type ReactNode } from "react";
import {
  Box,
  Button,
  Icon,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
} from "@mui/material";
import type {
  GetMovimentacoes,
  Movimentacao,
} from "../../../models/movimentacoes/GetMovimentacoes";
import TabelaDados, {
  type ColunaTabela,
} from "../../../componentes/tabela-dados/TabelaDados";
import ConclusaoMovimentacao from "../confirmacao/ConclusaoMovimentacao";
import AcaoEmMassa, {
  type TipoAcaoEmMassa,
} from "../acoes-em-massa/AcaoEmMassa";
import { CONSULTA_CELULAR, CONSULTA_ESTREITA } from "../../../estilos";
import ChipCategoria from "../../../componentes/chip-categoria/ChipCategoria";
import { valorComSinal } from "../../../utils/formatacao";

type PropTabelaMovimentacao = {
  movimentacao?: GetMovimentacoes; // sem dados ainda: tabela vazia (ou carregando)
  buscaMovimentacoes: () => void;
  filtros?: ReactNode; // barra de filtros no topo da tabela
  acoes?: ReactNode; // botões da tela junto dos ícones da tabela
  carregando?: boolean;
  ocultarValores?: boolean; // botão de olho: valores em R$ mascarados
  podeEditar?: boolean; // checkbox nas linhas + ações nas selecionadas (visualizador não tem)
};

// virtual (de agendamento) tem id 0: a chave usa o agendamento e a data
const chaveMov = (mov: Movimentacao): Key =>
  mov.id > 0 ? mov.id : `${mov.idFixo} ${mov.dthrMovimentacao}`;

const formatarData = (data: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(data))
    .replace(", ", " · "); // "16/11/2026 · 14:30"

const ehReceita = (mov: Movimentacao) => mov.tipo === 0;

// datas vêm em ISO do back-end, então ordenar o texto já ordena por data
const colunas = (ocultos: boolean): ColunaTabela<Movimentacao>[] => [
  {
    titulo: "Título",
    chave: "titulo",
    exibir: (mov) => (
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Box
          role="img"
          aria-label={ehReceita(mov) ? "Receita" : "Despesa"}
          sx={{
            width: 32,
            height: 32,
            flexShrink: 0,
            borderRadius: "8px",
            display: "grid",
            placeItems: "center",
            bgcolor: ehReceita(mov)
              ? "var(--fnc-tx-receita-fundo)"
              : "var(--fnc-tx-despesa-fundo)",
            color: ehReceita(mov)
              ? "var(--fnc-tx-receita)"
              : "var(--fnc-tx-despesa)",
          }}
        >
          <Icon sx={{ fontSize: 18 }}>
            {ehReceita(mov) ? "arrow_upward" : "arrow_downward"}
          </Icon>
        </Box>
        <Box
          component="span"
          sx={{ fontWeight: 500, color: "var(--fnc-tx-texto)" }}
        >
          {mov.titulo}
        </Box>
      </Stack>
    ),
  },
  {
    titulo: "Valor",
    chave: "valor",
    alinhar: "right",
    exibir: (mov) => (
      <Box
        component="span"
        sx={{
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          color: ehReceita(mov)
            ? "var(--fnc-tx-receita)"
            : "var(--fnc-tx-despesa)",
        }}
      >
        {valorComSinal(ehReceita(mov) ? mov.valor : -mov.valor, ocultos)}
      </Box>
    ),
  },
  {
    titulo: "Categoria",
    chave: "categorias",
    ordenarPor: (mov) => mov.categorias[0]?.nome,
    exibir: (mov) => (
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
        {mov.categorias.map((cat) => (
          <ChipCategoria key={cat.idCategoria} nome={cat.nome} cor={cat.cor} />
        ))}
      </Stack>
    ),
  },
  {
    titulo: "Status",
    chave: "concluido",
    exibir: (mov) => (
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Box
          aria-hidden
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: mov.concluido
              ? "var(--fnc-tx-receita-barra)"
              : "var(--fnc-tx-destaque)",
          }}
        />
        <span>{mov.concluido ? "Concluído" : "Pendente"}</span>
      </Stack>
    ),
  },
  {
    titulo: "Data mov.",
    chave: "dthrMovimentacao",
    exibir: (mov) => formatarData(mov.dthrMovimentacao),
  },
  // detalhes: escondidos por padrão, aparecem pelo menu "Colunas"
  { titulo: "Observação", chave: "observacao", oculta: true },
  {
    titulo: "Data conclusão",
    chave: "dthrConclusao",
    oculta: true,
    exibir: (mov) => mov.dthrConclusao && formatarData(mov.dthrConclusao),
  },
  {
    titulo: "Usu. cad.",
    chave: "usarioCriador",
    oculta: true,
    grupo: "usuarios",
    ordenarPor: (mov) => mov.usarioCriador?.email,
    exibir: (mov) => mov.usarioCriador?.email,
  },
  {
    titulo: "Usu. exe.",
    chave: "usuarioExecutor",
    oculta: true,
    grupo: "usuarios",
    ordenarPor: (mov) => mov.usuarioExecutor?.email,
    exibir: (mov) => mov.usuarioExecutor?.email,
  },
  {
    titulo: "Agendada",
    chave: "idFixo",
    oculta: true,
    ordenarPor: (mov) => Boolean(mov.idFixo),
    exibir: (mov) => (mov.idFixo ? "Sim" : "Não"),
  },
];

const ESTILOS = {
  // a barra de filtros é o topo do card da tabela
  barra: {
    flexWrap: "wrap", // no celular os botões descem para baixo do "Filtros"
    px: 2.5,
    py: 1.5,
    bgcolor: "color-mix(in srgb, var(--fnc-tx-barra-filtros) 60%, transparent)",
    borderBottom: "1px solid var(--fnc-tx-divisoria)",
    color: "var(--fnc-tx-apoio)",
    // pelo pé, como os filtros: os campos de data têm rótulo em cima
    alignItems: "flex-end",
    // último Stack = botões Colunas/Salvar do TabelaDados, na altura dos filtros (36px)
    "& > .MuiStack-root:last-of-type": { minHeight: 36, alignItems: "center" },
  },
  // o card (borda, cantos e o vidro fosco: translúcido + desfoque) fica em quem envolve a
  // tabela; aqui o fundo é transparente para as linhas mostrarem esse vidro
  container: {
    // ocupa o que sobra do card (que preenche a tela) e rola por dentro: a página não rola
    flex: 1,
    minHeight: 0,
    maxHeight: "none", // o padrão do TabelaDados/LinhasSeparadas (500px) deixaria sobra embaixo
    bgcolor: "transparent",
    border: 0,
    borderRadius: 0,
  },
  tabela: {
    minWidth: 760,
    "& .MuiTableCell-root": {
      p: "16px 20px",
      fontSize: 14,
      color: "var(--fnc-tx-texto-tabela)",
      borderBottom: 0,
    },
    "& .MuiTableCell-alignRight": { textAlign: "right" },
    "& .MuiTableHead-root .MuiTableCell-root": {
      py: 1.5,
      bgcolor: "var(--fnc-tx-superficie)", // sólido: o cabeçalho fixo cobre as linhas que rolam
      color: "var(--fnc-tx-apoio)",
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: "0.04em",
    },
    "& .MuiTableBody-root .MuiTableCell-root": {
      borderTop: "1px solid var(--fnc-tx-divisoria)",
    },
    // linhas translúcidas sobre o vidro do card
    "& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even)": {
      bgcolor:
        "color-mix(in srgb, var(--fnc-tx-linha-alternada) 50%, transparent)",
    },
    "& .MuiTableBody-root .MuiTableRow-hover:hover": {
      bgcolor: "color-mix(in srgb, var(--fnc-tx-trilho) 70%, transparent)",
    },
  },
  // linhas separadas: cards translúcidos sobre o mesmo vidro do card
  linhas: {
    // ocupa o que sobra do card (que preenche a tela) e rola por dentro: a página não rola
    flex: 1,
    minHeight: 0,
    maxHeight: "none", // o padrão do TabelaDados/LinhasSeparadas (500px) deixaria sobra embaixo
    p: 2,
    [`@media ${CONSULTA_ESTREITA}`]: { p: 1 }, // 380px: cada pixel vai para os cards
    color: "var(--fnc-tx-texto-tabela)",
    "& .linha-separada": {
      bgcolor:
        "color-mix(in srgb, var(--fnc-tx-linha-alternada) 60%, transparent)",
      border: "1px solid var(--fnc-tx-divisoria)",
      "&:hover": {
        filter: "none",
        bgcolor: "color-mix(in srgb, var(--fnc-tx-trilho) 70%, transparent)",
      },
    },
    "& .linha-separada-rotulo": { color: "var(--fnc-tx-apoio)" },
  },
};

const TabelaMovimentacao: React.FC<PropTabelaMovimentacao> = ({
  movimentacao,
  buscaMovimentacoes,
  filtros,
  acoes,
  carregando = false,
  ocultarValores = false,
  podeEditar = false,
}) => {
  // os checkboxes só aparecem depois do botão "Selecionar"; desligar desmarca tudo
  const [selecionando, setSelecionando] = useState(false);
  const [selecionadas, setSelecionadas] = useState<Key[]>([]);
  const alternarSelecionando = () => {
    setSelecionando(!selecionando);
    setSelecionadas([]);
  };
  const [ancoraAcoes, setAncoraAcoes] = useState<HTMLElement | null>(null);
  const [acaoEmMassa, setAcaoEmMassa] = useState<TipoAcaoEmMassa | null>(null);
  const linhas = movimentacao?.conteudo?.movimentacaos ?? [];
  // só as que estão na tela (filtro ou busca podem ter tirado alguma selecionada)
  const marcadas = linhas.filter((mov) => selecionadas.includes(chaveMov(mov)));
  // cada ação só mexe nas que ainda não estão no estado pedido
  const alvos: Record<TipoAcaoEmMassa, Movimentacao[]> = {
    concluir: marcadas.filter((mov) => !mov.concluido),
    extornar: marcadas.filter((mov) => mov.concluido),
    excluir: marcadas,
  };
  const ACOES: { acao: TipoAcaoEmMassa; rotulo: string; icone: string }[] = [
    { acao: "concluir", rotulo: "Concluir", icone: "check_circle" },
    { acao: "extornar", rotulo: "Extornar", icone: "undo" },
    { acao: "excluir", rotulo: "Excluir", icone: "delete" },
  ];
  const [movSelecionada, setMovSelecionada] = useState<Movimentacao | null>(
    null,
  );
  // memo: a TabelaDados reordena as linhas sempre que as colunas mudam
  const colunasMemo = useMemo(() => colunas(ocultarValores), [ocultarValores]);

  return (
    <>
      <TabelaDados
        idPreferencias="movimentacoes"
        linhas={linhas}
        colunas={colunasMemo}
        chaveLinha={chaveMov}
        selecao={
          podeEditar && selecionando
            ? { selecionadas, setSelecionadas }
            : undefined
        }
        onClicarLinha={setMovSelecionada}
        mensagemVazia="Nenhuma movimentação no período."
        barra={filtros}
        acoes={
          <>
            {podeEditar && (
              <Tooltip
                title={selecionando ? "Cancelar seleção" : "Selecionar várias"}
              >
                <IconButton
                  // primária enquanto a seleção está ligada, como o "Salvar" com alteração
                  color={selecionando ? "primary" : "inherit"}
                  aria-label={
                    selecionando ? "Cancelar seleção" : "Selecionar várias"
                  }
                  aria-pressed={selecionando}
                  onClick={alternarSelecionando}
                >
                  <Icon>{selecionando ? "close" : "checklist"}</Icon>
                </IconButton>
              </Tooltip>
            )}
            {selecionando && marcadas.length > 0 && (
              <Button
                variant="contained"
                startIcon={<Icon>checklist</Icon>}
                endIcon={<Icon>arrow_drop_down</Icon>}
                aria-haspopup="menu"
                aria-label={`Ações nas ${marcadas.length} selecionadas`}
                onClick={(e) => setAncoraAcoes(e.currentTarget)}
                // celular: só ícones e a contagem, senão o botão vaza da barra
                sx={{
                  flexShrink: 0,
                  [`@media ${CONSULTA_CELULAR}`]: {
                    minWidth: 0,
                    px: 1.25,
                    "& .MuiButton-startIcon": { mr: 0.5 },
                    "& .MuiButton-endIcon": { ml: 0 },
                  },
                }}
              >
                <Box
                  component="span"
                  sx={{ [`@media ${CONSULTA_CELULAR}`]: { display: "none" } }}
                >
                  Selecionadas&nbsp;
                </Box>
                {marcadas.length}
              </Button>
            )}
            {acoes}
          </>
        }
        carregando={carregando}
        estilos={ESTILOS}
        ordenacaoPadrao={{ chave: "dthrMovimentacao", direcao: "desc" }}
        permitirLinhas
      />

      <Menu
        anchorEl={ancoraAcoes}
        open={Boolean(ancoraAcoes)}
        onClose={() => setAncoraAcoes(null)}
      >
        {ACOES.map(({ acao, rotulo, icone }) => (
          <MenuItem
            key={acao}
            // ex.: só concluídas marcadas: não há o que concluir
            disabled={alvos[acao].length === 0}
            onClick={() => {
              setAncoraAcoes(null);
              setAcaoEmMassa(acao);
            }}
            sx={acao === "excluir" ? { color: "error.main" } : undefined}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <Icon fontSize="small">{icone}</Icon>
            </ListItemIcon>
            {rotulo} ({alvos[acao].length})
          </MenuItem>
        ))}
      </Menu>

      {acaoEmMassa && (
        <AcaoEmMassa
          acao={acaoEmMassa}
          movimentacoes={alvos[acaoEmMassa]}
          ignoradas={marcadas.length - alvos[acaoEmMassa].length}
          onClose={(alterou, falhas) => {
            setAcaoEmMassa(null);
            // as que falharam continuam marcadas, para tentar de novo
            setSelecionadas(falhas.map(chaveMov));
            if (alterou) buscaMovimentacoes();
          }}
        />
      )}

      {movSelecionada && (
        <ConclusaoMovimentacao
          onClose={() => setMovSelecionada(null)}
          buscaMovimentacoes={buscaMovimentacoes}
          movimentacaoSelecionada={movSelecionada}
        />
      )}
    </>
  );
};

export default TabelaMovimentacao;
