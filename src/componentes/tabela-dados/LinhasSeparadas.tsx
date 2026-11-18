import { useState, type Key, type ReactNode } from "react";
import {
  Box,
  Button,
  ButtonBase,
  CircularProgress,
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
      {/* sem cabeçalho: a ordenação fica neste botão */}
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
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 2,
                    p: 2,
                    borderRadius: "12px",
                    textAlign: "left",
                    color: "inherit",
                    transition: "filter 150ms",
                    "&:hover": { filter: "brightness(1.08)" },
                    "&.Mui-disabled": { color: "inherit" },
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
                </ButtonBase>
              ))}
      </Stack>
    </Stack>
  );
}

export default LinhasSeparadas;
