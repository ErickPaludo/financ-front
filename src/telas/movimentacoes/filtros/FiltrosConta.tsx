import { useState, type ReactNode } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Icon,
  InputAdornment,
  Stack,
  Typography,
} from "@mui/material";

import type { Categoria } from "../../../models/categorias/Categorias";
import Modal from "../../../componentes/modal/Modal";
import CampoTexto from "../../../props/campo-texto/CampoTexto";
import CheckBoxList from "../../../props/check-box-list/CheckBoxList";
import InputSelect from "../../../props/input-select/InputSelect";
import { estiloBotaoSecundario } from "../../../estilos";
import { formatarData, periodoDoMes } from "../../../utils/formatacao";
import FiltroPeriodo from "../filtro-periodo/FiltroPeriodo";
import { atalhosPeriodo, mesmoPeriodo } from "../filtro-periodo/periodo";
import {
  OPCOES_STATUS,
  OPCOES_TIPO,
  type FiltrosMovimentacao,
} from "../filtrosUrl";

const SEM_CATEGORIA: Categoria = {
  idCategoria: 0,
  nome: "Sem categoria",
  cor: "",
};

type PropFiltrosConta = {
  categorias: Categoria[];
  filtros: FiltrosMovimentacao;
  alterarFiltros: (mudanca: Partial<FiltrosMovimentacao>) => void;
  // busca por texto (só na tela, a API não filtra texto); sem setBusca o campo não aparece
  busca?: string;
  setBusca?: (busca: string) => void;
  rodape?: ReactNode; // fim do painel, depois de um Divider (ex.: "Ver detalhes" e botões da tela)
};

type FiltroAplicado = {
  chave: string;
  rotulo: string;
  limpar?: () => void; // sem ele, é o valor padrão (só informa)
};

// Filtros das telas da conta (transações e dashboard): na barra, o botão "Filtros" e os chips
// dos filtros aplicados (o X remove); o botão abre o painel na gaveta Modal.
const FiltrosConta: React.FC<PropFiltrosConta> = ({
  categorias,
  filtros,
  alterarFiltros,
  busca = "",
  setBusca,
  rodape,
}) => {
  const [aberto, setAberto] = useState(false);
  const itensCategoria = [SEM_CATEGORIA, ...categorias];

  const padrao = periodoDoMes();
  const periodo = { inicio: filtros.inicio, fim: filtros.fim };
  const atalho = atalhosPeriodo().find((a) => mesmoPeriodo(a.periodo, periodo));
  const rotuloOpcao = (opcoes: typeof OPCOES_STATUS, valor: string) =>
    opcoes.find((o) => o.valor === valor)?.rotulo ?? valor;

  const aplicados: FiltroAplicado[] = [
    {
      chave: "periodo",
      rotulo:
        atalho?.rotulo ??
        `${formatarData(filtros.inicio)} – ${formatarData(filtros.fim)}`,
      limpar: mesmoPeriodo(periodo, padrao)
        ? undefined
        : () => alterarFiltros(padrao),
    },
    ...(busca.trim()
      ? [
          {
            chave: "busca",
            rotulo: `Busca: ${busca.trim()}`,
            limpar: () => setBusca?.(""),
          },
        ]
      : []),
    ...filtros.categorias.map((id) => ({
      chave: `categoria-${id}`,
      rotulo:
        itensCategoria.find((c) => c.idCategoria === id)?.nome ??
        `Categoria ${id}`,
      limpar: () =>
        alterarFiltros({
          categorias: filtros.categorias.filter((c) => c !== id),
        }),
    })),
    ...(filtros.status !== "todas"
      ? [
          {
            chave: "status",
            rotulo: `Status: ${rotuloOpcao(OPCOES_STATUS, filtros.status)}`,
            limpar: () => alterarFiltros({ status: "todas" }),
          },
        ]
      : []),
    ...(filtros.tipo !== "todas"
      ? [
          {
            chave: "tipo",
            rotulo: `Tipo: ${rotuloOpcao(OPCOES_TIPO, filtros.tipo)}`,
            limpar: () => alterarFiltros({ tipo: "todas" }),
          },
        ]
      : []),
  ];
  const ativos = aplicados.filter((f) => f.limpar);

  const limparTudo = () => {
    alterarFiltros({
      ...padrao,
      categorias: [],
      status: "todas",
      tipo: "todas",
    });
    setBusca?.("");
  };

  const chips = (lista: FiltroAplicado[]) =>
    lista.map((f) => (
      <Chip
        key={f.chave}
        label={f.rotulo}
        size="small"
        onDelete={f.limpar} // pelo teclado: foco no chip + Delete/Backspace
        title={f.rotulo} // texto inteiro quando o chip corta com "…"
        sx={{ maxWidth: "100%" }}
      />
    ));

  const qtdCategorias = filtros.categorias.length;

  return (
    <>
      <Stack
        direction="row"
        // base de 240px: sem esse espaço (celular), os botões ao lado descem para a linha de
        // baixo em vez de espremer o "Filtros" e empurrar os chips para baixo dele
        sx={{
          flex: "1 1 240px",
          minWidth: 0,
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Button
          startIcon={<Icon>filter_list</Icon>}
          aria-haspopup="dialog"
          onClick={() => setAberto(true)}
          // altura fixa: o texto não pode quebrar nem o botão encolher (no celular vazava)
          sx={{
            ...estiloBotaoSecundario,
            height: 36,
            px: 2,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          Filtros{ativos.length > 0 && ` (${ativos.length})`}
        </Button>
        {chips(aplicados)}
      </Stack>

      <Modal aberto={aberto} onClose={() => setAberto(false)} titulo="Filtros">
        <Stack spacing={3}>
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
              {ativos.length === 0
                ? "Nenhum filtro ativo"
                : `${ativos.length} ${ativos.length === 1 ? "filtro ativo" : "filtros ativos"}`}
            </Typography>
            <Button
              variant="text"
              disabled={ativos.length === 0}
              onClick={limparTudo}
            >
              Limpar tudo
            </Button>
          </Stack>

          <FiltroPeriodo
            dataInicial={filtros.inicio}
            dataFinal={filtros.fim}
            onChange={(inicio, fim) => alterarFiltros({ inicio, fim })}
          />

          {setBusca && (
            <CampoTexto
              label="Buscar"
              placeholder="Título ou observação"
              valor={busca}
              setValor={setBusca}
              fullWidth
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon fontSize="small">search</Icon>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}

          <CheckBoxList<Categoria>
            itens={itensCategoria}
            chaveId="idCategoria"
            chaveTexto="nome"
            selecionados={filtros.categorias}
            setSelecionados={(selecionadas) =>
              alterarFiltros({ categorias: selecionadas })
            }
            ignorarPrimeiroItem
            gatilho={({ abrir, aberto: listaAberta }) => (
              <CampoTexto
                label="Categorias"
                valor={
                  qtdCategorias === 0
                    ? "Todas"
                    : `${qtdCategorias} ${qtdCategorias === 1 ? "selecionada" : "selecionadas"}`
                }
                setValor={() => {}} // só leitura: o valor vem da seleção
                fullWidth
                onClick={abrir}
                slotProps={{
                  input: {
                    readOnly: true,
                    sx: { cursor: "pointer", "& input": { cursor: "pointer" } },
                    endAdornment: (
                      <InputAdornment position="end">
                        <Icon>
                          {listaAberta ? "expand_less" : "expand_more"}
                        </Icon>
                      </InputAdornment>
                    ),
                  },
                  htmlInput: {
                    "aria-haspopup": "listbox",
                    "aria-expanded": listaAberta,
                  },
                }}
              />
            )}
          />

          <Box
            sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}
          >
            <InputSelect
              rotulo="Status"
              opcoes={OPCOES_STATUS}
              valor={filtros.status}
              setValor={(valor) =>
                alterarFiltros({
                  status: valor as FiltrosMovimentacao["status"],
                })
              }
            />
            <InputSelect
              rotulo="Tipo"
              opcoes={OPCOES_TIPO}
              valor={filtros.tipo}
              setValor={(valor) =>
                alterarFiltros({ tipo: valor as FiltrosMovimentacao["tipo"] })
              }
            />
          </Box>

          {ativos.length > 0 && (
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {chips(ativos)}
            </Stack>
          )}

          {rodape && (
            <>
              <Divider />
              {rodape}
            </>
          )}
        </Stack>
      </Modal>
    </>
  );
};

export default FiltrosConta;
