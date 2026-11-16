import { useMemo, useState, type Key, type ReactNode } from "react";
import {
  Checkbox,
  CircularProgress,
  Icon,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Popover,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";

import {
  lerPreferencias,
  moverItem,
  ordenarLinhas,
  salvarPreferencias,
  normalizarPreferencias,
  type Ordenacao,
  type PreferenciasTabela,
} from "./preferenciasTabela";

export type ColunaTabela<T> = {
  titulo: string;
  chave: keyof T & string;
  // o que aparece na célula; sem ele, o valor do campo como está
  exibir?: (linha: T) => ReactNode;
  // valor usado na ordenação; sem ele, o valor do campo
  ordenarPor?: (linha: T) => unknown;
  oculta?: boolean; // começa escondida (o usuário pode mostrar pelo menu "Colunas")
  alinhar?: "right"; // ex.: valores em dinheiro
};

// sx somado por cima do visual padrão de cada parte
type EstilosTabela = Partial<
  Record<"barra" | "container" | "tabela", SxProps<Theme>>
>;

const somar = (base: SxProps<Theme>, extra?: SxProps<Theme>) =>
  [base, ...(Array.isArray(extra) ? extra : [extra])] as SxProps<Theme>;

type PropTabelaDados<T> = {
  titulo?: string;
  linhas: T[];
  colunas: ColunaTabela<T>[];
  onClicarLinha?: (linha: T) => void;
  chaveLinha?: (linha: T, indice: number) => Key;
  // com id, ordem/visibilidade/ordenação das colunas podem ser salvas no localStorage
  idPreferencias?: string;
  mensagemVazia?: string;
  carregando?: boolean; // enquanto a API não responde: bola de carregamento no lugar das linhas
  // conteúdo à esquerda dos botões de colunas (ex.: filtros)
  barra?: ReactNode;
  estilos?: EstilosTabela;
  ordenacaoPadrao?: Ordenacao;
};

// Tabela com colunas reordenáveis (arrastando o cabeçalho ou pelo menu "Colunas"),
// ordenação ao clicar no cabeçalho e escolha das colunas visíveis.
// As cores vêm das variáveis --fnc-* (cores.ts, telas) para seguir o modo da tela.
function TabelaDados<T extends object>({
  titulo,
  linhas,
  colunas,
  onClicarLinha,
  chaveLinha = (_, i) => i,
  idPreferencias,
  mensagemVazia = "Nenhum dado encontrado.",
  carregando = false,
  barra,
  estilos,
  ordenacaoPadrao = null,
}: PropTabelaDados<T>) {
  const chaves = colunas.map((c) => c.chave as string);
  const [prefs, setPrefs] = useState<PreferenciasTabela>(() => {
    const padrao = {
      ocultas: colunas.filter((c) => c.oculta).map((c) => c.chave as string),
      ordenacao: ordenacaoPadrao,
    };
    return idPreferencias
      ? lerPreferencias(idPreferencias, chaves, padrao)
      : normalizarPreferencias(null, chaves, padrao);
  });
  const [salvas, setSalvas] = useState(() => JSON.stringify(prefs));
  const [aviso, setAviso] = useState<string | null>(null);
  const [ancoraColunas, setAncoraColunas] = useState<HTMLElement | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);

  const porChave = new Map(colunas.map((c) => [c.chave as string, c]));
  const visiveis = prefs.ordem
    .filter((c) => !prefs.ocultas.includes(c))
    .map((c) => porChave.get(c)!);

  const linhasOrdenadas = useMemo(() => {
    const o = prefs.ordenacao;
    const coluna = o && colunas.find((c) => c.chave === o.chave);
    if (!o || !coluna) return linhas;
    const valor = coluna.ordenarPor ?? ((l: T) => l[coluna.chave]);
    return ordenarLinhas(linhas, valor, o.direcao);
  }, [linhas, colunas, prefs.ordenacao]);

  const alterado = JSON.stringify(prefs) !== salvas;

  const alternarOrdenacao = (chave: string) => {
    const o = prefs.ordenacao;
    const ordenacao =
      o?.chave !== chave
        ? { chave, direcao: "asc" as const }
        : o.direcao === "asc"
          ? { chave, direcao: "desc" as const }
          : null; // terceiro clique volta à ordem original
    setPrefs({ ...prefs, ordenacao });
  };

  const mover = (chave: string, para: number) =>
    setPrefs({
      ...prefs,
      ordem: moverItem(prefs.ordem, prefs.ordem.indexOf(chave), para),
    });

  const alternarVisivel = (chave: string) =>
    setPrefs({
      ...prefs,
      ocultas: prefs.ocultas.includes(chave)
        ? prefs.ocultas.filter((c) => c !== chave)
        : [...prefs.ocultas, chave],
    });

  const salvar = () => {
    if (!idPreferencias) return;
    if (salvarPreferencias(idPreferencias, prefs)) {
      setSalvas(JSON.stringify(prefs));
      setAviso("Preferências da tabela salvas");
    } else setAviso("O navegador bloqueou o salvamento");
  };

  return (
    <Stack spacing={1} sx={{ flex: 1, minWidth: 0, width: "100%" }}>
      <Stack
        direction="row"
        spacing={1}
        sx={somar(
          {
            alignItems: "center",
            justifyContent: "flex-end",
            color: "var(--fnc-texto)",
          },
          estilos?.barra,
        )}
      >
        {barra}
        {titulo && (
          <Typography
            component="h2"
            sx={{ flex: 1, fontSize: 20, fontWeight: 600, color: "inherit" }}
          >
            {titulo}
          </Typography>
        )}
        <Stack direction="row" spacing={1}>
          <Tooltip title="Escolher e reordenar colunas">
            <IconButton
              color="inherit"
              aria-label="Colunas"
              aria-haspopup="dialog"
              onClick={(e) => setAncoraColunas(e.currentTarget)}
            >
              <Icon>tune</Icon>
            </IconButton>
          </Tooltip>
          {idPreferencias && (
            <Tooltip title="Salvar preferências da tabela">
              {/* span: o Tooltip precisa de um elemento ativo mesmo com o botão desabilitado */}
              <span>
                <IconButton
                  color="inherit"
                  aria-label="Salvar preferências da tabela"
                  disabled={!alterado}
                  onClick={salvar}
                  sx={{ "&.Mui-disabled": { color: "inherit", opacity: 0.4 } }}
                >
                  <Icon>save</Icon>
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      <Popover
        open={Boolean(ancoraColunas)}
        anchorEl={ancoraColunas}
        onClose={() => setAncoraColunas(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <List dense aria-label="Colunas da tabela" sx={{ minWidth: 260 }}>
          {prefs.ordem.map((chave, i) => {
            const visivel = !prefs.ocultas.includes(chave);
            const nome = porChave.get(chave)!.titulo;
            return (
              <ListItem
                key={chave}
                secondaryAction={
                  <>
                    <IconButton
                      size="small"
                      aria-label={`Mover ${nome} para cima`}
                      disabled={i === 0}
                      onClick={() => mover(chave, i - 1)}
                    >
                      <Icon fontSize="small">arrow_upward</Icon>
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label={`Mover ${nome} para baixo`}
                      disabled={i === prefs.ordem.length - 1}
                      onClick={() => mover(chave, i + 1)}
                    >
                      <Icon fontSize="small">arrow_downward</Icon>
                    </IconButton>
                  </>
                }
                sx={{ pr: 11 }}
              >
                <Checkbox
                  edge="start"
                  size="small"
                  checked={visivel}
                  // a última coluna visível não pode ser escondida
                  disabled={visivel && visiveis.length === 1}
                  onChange={() => alternarVisivel(chave)}
                  slotProps={{ input: { "aria-label": `Mostrar ${nome}` } }}
                />
                <ListItemText primary={nome} />
              </ListItem>
            );
          })}
        </List>
      </Popover>

      <TableContainer
        sx={somar(
          {
            maxHeight: 500,
            bgcolor: "var(--fnc-superficie)",
            border: "1px solid var(--fnc-borda-suave)",
            borderRadius: 1,
          },
          estilos?.container,
        )}
      >
        <Table
          stickyHeader
          sx={somar(
            {
              // largura mínima: em telas pequenas a tabela rola em vez de espremer
              minWidth: 700,
              "& .MuiTableCell-root": {
                borderColor: "var(--fnc-borda-suave)",
                color: "var(--fnc-texto-superficie)",
                textAlign: "center",
                fontSize: 13,
                whiteSpace: "nowrap",
              },
              "& .MuiTableCell-alignRight": { textAlign: "right" },
              "& .MuiTableHead-root .MuiTableCell-root": {
                bgcolor: "var(--fnc-cabecalho)",
                color: "var(--fnc-apagado)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: "uppercase",
                cursor: "grab",
              },
              // o TableSortLabel usa as cores do tema; aqui segue a do cabeçalho
              "& .MuiTableSortLabel-root, & .MuiTableSortLabel-root:hover, & .MuiTableSortLabel-root.Mui-active, & .MuiTableSortLabel-root.Mui-active .MuiTableSortLabel-icon":
                { color: "inherit" },
            },
            estilos?.tabela,
          )}
        >
          <TableHead>
            <TableRow>
              {visiveis.map((coluna) => {
                const o = prefs.ordenacao;
                const ativa = o?.chave === coluna.chave;
                return (
                  <TableCell
                    key={coluna.chave}
                    align={coluna.alinhar}
                    draggable
                    sortDirection={ativa ? o!.direcao : false}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      setArrastando(coluna.chave);
                    }}
                    onDragOver={(e) => arrastando && e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (arrastando)
                        mover(arrastando, prefs.ordem.indexOf(coluna.chave));
                      setArrastando(null);
                    }}
                    onDragEnd={() => setArrastando(null)}
                    sx={{
                      opacity: arrastando === coluna.chave ? 0.5 : 1,
                    }}
                  >
                    <TableSortLabel
                      active={ativa}
                      direction={ativa ? o!.direcao : "asc"}
                      onClick={() => alternarOrdenacao(coluna.chave)}
                    >
                      {coluna.titulo}
                    </TableSortLabel>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {!carregando && linhasOrdenadas.map((linha, indice) => (
              <TableRow
                key={chaveLinha(linha, indice)}
                hover={Boolean(onClicarLinha)}
                onClick={onClicarLinha && (() => onClicarLinha(linha))}
                sx={{
                  cursor: onClicarLinha ? "pointer" : undefined,
                  "&.MuiTableRow-hover:hover": {
                    bgcolor: "var(--fnc-linha-hover)",
                  },
                  "&:last-child td": { borderBottom: 0 },
                }}
              >
                {visiveis.map((coluna) => (
                  <TableCell key={coluna.chave} align={coluna.alinhar}>
                    {coluna.exibir
                      ? coluna.exibir(linha)
                      : (linha[coluna.chave] as ReactNode)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {carregando && (
              <TableRow>
                <TableCell colSpan={visiveis.length} sx={{ py: 4 }}>
                  <CircularProgress
                    size={32}
                    aria-label="Carregando dados da tabela"
                    sx={{ display: "block", mx: "auto", color: "inherit" }}
                  />
                </TableCell>
              </TableRow>
            )}
            {!carregando && linhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={visiveis.length} sx={{ py: 4 }}>
                  {mensagemVazia}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={Boolean(aviso)}
        autoHideDuration={3000}
        onClose={() => setAviso(null)}
        message={aviso}
      />
    </Stack>
  );
}

export default TabelaDados;
