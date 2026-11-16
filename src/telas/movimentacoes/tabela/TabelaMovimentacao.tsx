import { useState, type ReactNode } from "react";
import { Box, Chip, Icon, Stack } from "@mui/material";
import type {
  GetMovimentacoes,
  Movimentacao,
} from "../../../models/movimentacoes/GetMovimentacoes";
import TabelaDados, {
  type ColunaTabela,
} from "../../../componentes/tabela-dados/TabelaDados";
import ConclusaoMovimentacao from "../confirmacao/ConclusaoMovimentacao";
import { coresChipCategoria } from "../../../utils/corCategoria";
import { valorComSinal } from "../../../utils/formatacao";

type PropTabelaMovimentacao = {
  movimentacao?: GetMovimentacoes; // sem dados ainda: tabela vazia (ou carregando)
  buscaMovimentacoes: () => void;
  filtros?: ReactNode; // barra de filtros no topo da tabela
  carregando?: boolean;
};

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
const COLUNAS: ColunaTabela<Movimentacao>[] = [
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
    titulo: "Categoria",
    chave: "categorias",
    ordenarPor: (mov) => mov.categorias[0]?.nome,
    exibir: (mov) => (
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
        {mov.categorias.map((cat) => {
          const cores = coresChipCategoria(cat.cor);
          return (
            <Chip
              key={cat.idCategoria}
              label={cat.nome}
              size="small"
              sx={{
                borderRadius: 999,
                fontWeight: 500,
                bgcolor: cores?.fundo ?? "var(--fnc-tx-chip-fundo)",
                color: cores?.texto ?? "var(--fnc-tx-chip-texto)",
              }}
            />
          );
        })}
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
    ordenarPor: (mov) => mov.usarioCriador?.email,
    exibir: (mov) => mov.usarioCriador?.email,
  },
  {
    titulo: "Usu. exe.",
    chave: "usuarioExecutor",
    oculta: true,
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
        {valorComSinal(ehReceita(mov) ? mov.valor : -mov.valor)}
      </Box>
    ),
  },
];

const ESTILOS = {
  // a barra de filtros é o topo do card da tabela
  barra: {
    px: 2.5,
    py: 1.5,
    bgcolor: "color-mix(in srgb, var(--fnc-tx-barra-filtros) 60%, transparent)",
    borderBottom: "1px solid var(--fnc-tx-divisoria)",
    color: "var(--fnc-tx-apoio)",
    // pelo pé, como os filtros: os campos de data têm rótulo em cima
    alignItems: "flex-end",
    // último Stack = botões Colunas/Salvar do TabelaDados, na altura dos filtros (36px)
    "& > .MuiStack-root:last-of-type": { height: 36, alignItems: "center" },
  },
  // o card (borda, cantos e o vidro fosco: translúcido + desfoque) fica em quem envolve a
  // tabela; aqui o fundo é transparente para as linhas mostrarem esse vidro
  container: {
    maxHeight: 560,
    bgcolor: "transparent",
    border: 0,
    borderRadius: 0,
  },
  tabela: {
    minWidth: 760,
    "& .MuiTableCell-root": {
      p: "16px 20px",
      textAlign: "left",
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
};

const TabelaMovimentacao: React.FC<PropTabelaMovimentacao> = ({
  movimentacao,
  buscaMovimentacoes,
  filtros,
  carregando = false,
}) => {
  const [movSelecionada, setMovSelecionada] = useState<Movimentacao | null>(
    null,
  );

  return (
    <>
      <TabelaDados
        idPreferencias="movimentacoes"
        linhas={movimentacao?.conteudo?.movimentacaos ?? []}
        colunas={COLUNAS}
        chaveLinha={(mov) =>
          mov.id > 0 ? mov.id : `${mov.idFixo} ${mov.dthrMovimentacao}`
        }
        onClicarLinha={setMovSelecionada}
        mensagemVazia="Nenhuma movimentação no período."
        barra={filtros}
        carregando={carregando}
        estilos={ESTILOS}
        ordenacaoPadrao={{ chave: "dthrMovimentacao", direcao: "desc" }}
      />

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
