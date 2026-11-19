import { useState, type Key, type ReactNode } from "react";
import {
  Box,
  Button,
  ButtonBase,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Divider,
  Icon,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import type { ColunaTabela } from "./TabelaDados";
import type { Ordenacao } from "./preferenciasTabela";
import { CONSULTA_ESTREITA } from "../../estilos";

// celular em pé (ex.: 380×800): menos respiro e colunas de 110px, para caberem duas por linha
const ESTREITA = `@media ${CONSULTA_ESTREITA}`;

type PropLinhasSeparadas<T> = {
  linhas: T[];
  colunas: ColunaTabela<T>[]; // só as visíveis, na ordem escolhida
  onClicarLinha?: (linha: T) => void;
  chaveLinha: (linha: T, indice: number) => Key;
  mensagemVazia: string;
  carregando: boolean;
  sx?: SxProps<Theme>;
  ordenacao: Ordenacao;
  ordenacaoPadrao: Ordenacao; // "Redefinir ordenação" volta para ela
  setOrdenacao: (ordenacao: Ordenacao) => void;
  // seleção já resolvida pelo TabelaDados (só as linhas da tela)
  selecao?: {
    marcadas: Key[];
    todasMarcadas: boolean;
    alternarTodas: () => void;
    alternarLinha: (chave: Key) => void;
  };
};

// Mesmas colunas do TabelaDados, mas cada linha é um card separado, com o nome da
// coluna acima do valor. As colunas quebram em várias linhas em telas estreitas.
// Classes para o sx de quem usa: .linha-separada (card) e .linha-separada-rotulo.
function LinhasSeparadas<T extends object>({
  linhas,
  colunas,
  onClicarLinha,
  chaveLinha,
  mensagemVazia,
  carregando,
  sx,
  ordenacao,
  ordenacaoPadrao,
  setOrdenacao,
  selecao,
}: PropLinhasSeparadas<T>) {
  // cada célula do card: uma coluna ou as colunas do mesmo grupo, empilhadas
  const celulas: ColunaTabela<T>[][] = [];
  for (const coluna of colunas) {
    const doGrupo =
      coluna.grupo && celulas.find((c) => c[0].grupo === coluna.grupo);
    if (doGrupo) doGrupo.push(coluna);
    else celulas.push([coluna]);
  }

  const [ancora, setAncora] = useState<HTMLElement | null>(null);
  const colunaAtiva = colunas.find((c) => c.chave === ordenacao?.chave);

  const aviso = (conteudo: ReactNode) => (
    <Box sx={{ py: 4, textAlign: "center" }}>{conteudo}</Box>
  );

  return (
    <Stack
      spacing={1.5}
      sx={[
        {
          maxHeight: 500,
          color: "var(--fnc-texto-superficie)",
          "& .linha-separada": {
            bgcolor: "var(--fnc-superficie)",
            border: "1px solid var(--fnc-borda-suave)",
          },
          "& .linha-separada-rotulo": { color: "var(--fnc-apagado)" },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {/* sem cabeçalho: "selecionar tudo" e a ordenação ficam aqui */}
      <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
        {selecao && (
          <FormControlLabel
            label="Selecionar tudo"
            // mesmo recuo da caixa dos cards (1px de borda + respiro - 8px): uma coluna só
            sx={{ ml: "9px", mr: 1, [ESTREITA]: { ml: "3px" } }}
            control={
              <Checkbox
                size="small"
                checked={selecao.todasMarcadas}
                indeterminate={
                  selecao.marcadas.length > 0 && !selecao.todasMarcadas
                }
                disabled={linhas.length === 0}
                onChange={selecao.alternarTodas}
                sx={{ color: "inherit" }}
              />
            }
          />
        )}
        <Button
          color="inherit"
          startIcon={<Icon>sort</Icon>}
          aria-haspopup="menu"
          onClick={(e) => setAncora(e.currentTarget)}
          sx={{ alignSelf: "flex-start", textTransform: "none" }}
        >
          {colunaAtiva
            ? `Ordenar: ${colunaAtiva.titulo} ${ordenacao!.direcao === "asc" ? "↑" : "↓"}`
            : "Ordenar por"}
        </Button>
      </Stack>
      <Menu
        anchorEl={ancora}
        open={Boolean(ancora)}
        onClose={() => setAncora(null)}
      >
        {colunas.map((coluna) => {
          const ativa = ordenacao?.chave === coluna.chave;
          return (
            <MenuItem
              key={coluna.chave}
              selected={ativa}
              onClick={() => {
                // na coluna já escolhida, inverte a direção
                setOrdenacao({
                  chave: coluna.chave,
                  direcao:
                    ativa && ordenacao!.direcao === "asc" ? "desc" : "asc",
                });
                setAncora(null);
              }}
            >
              <ListItemIcon>
                {ativa && (
                  <Icon fontSize="small">
                    {ordenacao!.direcao === "asc"
                      ? "arrow_upward"
                      : "arrow_downward"}
                  </Icon>
                )}
              </ListItemIcon>
              {coluna.titulo}
            </MenuItem>
          );
        })}
        <Divider />
        <MenuItem
          disabled={
            JSON.stringify(ordenacao) === JSON.stringify(ordenacaoPadrao)
          }
          onClick={() => {
            setOrdenacao(ordenacaoPadrao);
            setAncora(null);
          }}
        >
          <ListItemIcon>
            <Icon fontSize="small">restart_alt</Icon>
          </ListItemIcon>
          Redefinir ordenação
        </MenuItem>
      </Menu>

      <Stack spacing={1} sx={{ minHeight: 0, overflow: "auto" }}>
        {carregando
          ? aviso(
              <CircularProgress
                size={32}
                aria-label="Carregando dados"
                sx={{ color: "inherit" }}
              />,
            )
          : linhas.length === 0
            ? aviso(mensagemVazia)
            : linhas.map((linha, indice) => (
                <ButtonBase
                  key={chaveLinha(linha, indice)}
                  component="div"
                  className="linha-separada"
                  disabled={!onClicarLinha}
                  onClick={onClicarLinha && (() => onClicarLinha(linha))}
                  sx={{
                    flexShrink: 0,
                    // caixa de seleção à esquerda, centralizada na altura do card; as colunas ao lado
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 2,
                    [ESTREITA]: { p: 1.25, gap: 0.5 },
                    borderRadius: "12px",
                    textAlign: "left",
                    color: "inherit",
                    transition: "filter 150ms",
                    "&:hover": { filter: "brightness(1.08)" },
                    "&.Mui-disabled": { color: "inherit" },
                  }}
                >
                  {selecao && (
                    // o clique na caixa não abre a linha
                    <Box
                      onClick={(e) => e.stopPropagation()}
                      sx={{ flexShrink: 0, ml: -1 }}
                    >
                      <Checkbox
                        size="small"
                        checked={selecao.marcadas.includes(
                          chaveLinha(linha, indice),
                        )}
                        onChange={() =>
                          selecao.alternarLinha(chaveLinha(linha, indice))
                        }
                        onMouseDown={(e) => e.stopPropagation()} // sem a "onda" do card
                        sx={{ color: "inherit" }}
                        slotProps={{
                          input: { "aria-label": "Selecionar linha" },
                        }}
                      />
                    </Box>
                  )}
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: 2,
                      [ESTREITA]: {
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(110px, 1fr))",
                        columnGap: 1.5,
                        rowGap: 1.25,
                      },
                    }}
                  >
                    {celulas.map((grupo) => (
                      <Stack
                        key={grupo[0].chave}
                        spacing={1.5}
                        sx={{ minWidth: 0 }}
                      >
                        {grupo.map((coluna) => (
                          <Box
                            key={coluna.chave}
                            sx={{
                              minWidth: 0,
                              fontSize: 14,
                              textAlign: coluna.alinhar ?? "left",
                            }}
                          >
                            <Typography
                              className="linha-separada-rotulo"
                              sx={{
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: 1,
                                textTransform: "uppercase",
                                mb: 0.5,
                              }}
                            >
                              {coluna.titulo}
                            </Typography>
                            {coluna.exibir
                              ? coluna.exibir(linha)
                              : (linha[coluna.chave] as ReactNode)}
                          </Box>
                        ))}
                      </Stack>
                    ))}
                  </Box>
                </ButtonBase>
              ))}
      </Stack>
    </Stack>
  );
}

export default LinhasSeparadas;
