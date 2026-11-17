import { useContext, useState } from "react";
import { Box, Button, Icon } from "@mui/material";

import { TIPO_MOVIMENTACAO } from "../../models/movimentacoes/GetMovimentacoes";
import { ContaContext } from "../../contexts/ContaContext";
import { useBuscaApi } from "../../hooks/useBuscaApi";
import TabelaDados, { type ColunaTabela } from "../tabela-dados/TabelaDados";
import { CabecalhoPainel, EstadoLista } from "../painel-lateral/PainelLateral";
import FormularioAgendada from "./FormularioAgendada";
import { formatarMoeda } from "../../utils/formatacao";
import {
  NOME_OCORRENCIA,
  descreverOcorrencia,
  formatarDataAgendada,
  type Agendada,
} from "./agendadas";

const linhaDaTabela = (agendada: Agendada) => ({
  agendada,
  titulo: agendada.movimentacaoBase.titulo,
  tipoMov:
    agendada.movimentacaoBase.tipo === TIPO_MOVIMENTACAO.Receita
      ? "Receita"
      : "Despesa",
  valor: formatarMoeda(agendada.movimentacaoBase.valor),
  tipo: NOME_OCORRENCIA[agendada.tipo] ?? agendada.tipo,
  dataOcorrencia: descreverOcorrencia(agendada),
  dataInicio: formatarDataAgendada(agendada.dataInicio),
  dataFim: formatarDataAgendada(agendada.dataFim),
});

type LinhaAgendada = ReturnType<typeof linhaDaTabela>;

const COLUNAS: ColunaTabela<LinhaAgendada>[] = [
  { titulo: "Título", chave: "titulo" },
  { titulo: "Tipo mov.", chave: "tipoMov" },
  { titulo: "Valor", chave: "valor", alinhar: "right" },
  { titulo: "Tipo", chave: "tipo" },
  { titulo: "Ocorrência", chave: "dataOcorrencia" },
  { titulo: "Início", chave: "dataInicio" },
  { titulo: "Fim", chave: "dataFim" },
];

// TabelaDados com as cores do tema MUI (o painel fica fora da área central, sem as variáveis --fnc-*)
const ESTILOS_TABELA = {
  barra: { color: "text.secondary" },
  container: {
    // o cabeçalho fixo continua visível: a tabela rola, não o painel
    maxHeight: "calc(100dvh - 190px)",
    bgcolor: "background.paper",
    border: 1,
    borderColor: "divider",
    borderRadius: 2,
  },
  tabela: {
    "& .MuiTableCell-root": {
      color: "text.primary",
      borderColor: "divider",
    },
    "& .MuiTableCell-alignRight": { textAlign: "right" },
    "& .MuiTableHead-root .MuiTableCell-root": {
      bgcolor: "background.default",
      color: "text.secondary",
    },
    "& .MuiTableBody-root .MuiTableRow-hover:hover": {
      bgcolor: "action.hover",
    },
  },
};

// Conteúdo do painel lateral (largo) de movimentações agendadas da conta.
// Clicar numa linha edita; "Nova agendada" cadastra (formulário na gaveta da direita).
const PainelAgendadas: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { conta } = useContext(ContaContext);
  const {
    dados,
    erro,
    carregando,
    buscar: buscarAgendadas,
  } = useBuscaApi<{ conteudo: Agendada[] }>(
    `/Contas/${conta!.idConta}/Movimentacoes/Fixa`,
    "Não foi possível carregar as agendadas.",
  );
  const agendadas = dados?.conteudo ?? [];
  // a agendada continua guardada ao fechar a gaveta: o formulário não troca durante a animação
  const [gaveta, setGaveta] = useState<{
    aberta: boolean;
    agendada: Agendada | null;
  }>({ aberta: false, agendada: null });

  return (
    <>
      <CabecalhoPainel
        avatar={<Icon>browse_gallery</Icon>}
        titulo="Agendadas"
        subtitulo={
          <>
            {conta!.titulo}
            {!carregando &&
              ` · ${agendadas.length} ${agendadas.length === 1 ? "agendada" : "agendadas"}`}
          </>
        }
        onAtualizar={buscarAgendadas}
        onClose={onClose}
      />

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 1.5, p: 2 }}>
        <EstadoLista erro={erro} />

        <TabelaDados
          idPreferencias="movimentacoes-fixas"
          linhas={agendadas.map(linhaDaTabela)}
          carregando={carregando}
          colunas={COLUNAS}
          mensagemVazia="Nenhuma movimentação agendada."
          onClicarLinha={({ agendada }) => setGaveta({ aberta: true, agendada })}
          estilos={ESTILOS_TABELA}
          barra={
            <Button
              variant="contained"
              size="small"
              startIcon={<Icon>add</Icon>}
              onClick={() => setGaveta({ aberta: true, agendada: null })}
              sx={{ mr: "auto" }}
            >
              Nova agendada
            </Button>
          }
        />
      </Box>

      <FormularioAgendada
        aberto={gaveta.aberta}
        agendada={gaveta.agendada}
        onClose={() => setGaveta((g) => ({ ...g, aberta: false }))}
        onSalvo={buscarAgendadas}
      />
    </>
  );
};

export default PainelAgendadas;
