import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Card,
  Icon,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { AuthContext } from "../../../../contexts/AuthContext";
import { ContaContext } from "../../../../contexts/ContaContext";
import type { ContaBancaria } from "../../../../models/contas-usuarios/GetContasBancarias";
import type { GetContaUsuario } from "../../../../models/contas-usuarios/GetContaUsuario";
import api from "../../../../services/api/apiConnect";
import { exibirMoeda } from "../../../../utils/formatacao";
import Indicador from "../indicador/Indicador";

const COR_SALDO_INATIVO = "#d6d6da";

// Texto escuro em fundos claros e branco em fundos escuros (luminância simplificada).
const corDoTexto = (corFundo: string) => {
  const r = parseInt(corFundo.slice(1, 3), 16);
  const g = parseInt(corFundo.slice(3, 5), 16);
  const b = parseInt(corFundo.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 186 ? "#292a2b" : "#ffffff";
};

const formatarDataHora = (dataUtc: string) =>
  new Date(dataUtc)
    .toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", ""); // "16/11/2026 14:05", como antes

type Props = {
  conta: ContaBancaria;
  ocultarValores?: boolean;
  onEditar: () => void; // abre a edição de nome e cor
  onAlterada: () => void; // depois de favoritar ou mudar a soma do saldo
};

const PERMISSAO_ADMIN = 0;

// Card de uma conta bancária na tela inicial. Clicar abre as movimentações (só contas ativas).
const ContaComponent: React.FC<Props> = ({
  conta,
  ocultarValores = false,
  onEditar,
  onAlterada,
}) => {
  const { setConta } = useContext(ContaContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Menu de 3 pontos: as mesmas opções da tela de configurações da conta.
  const [ancoraMenu, setAncoraMenu] = useState<HTMLElement | null>(null);
  const [admin, setAdmin] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const abrirMenu = async (elemento: HTMLElement) => {
    setAncoraMenu(elemento);
    // a permissão não vem na lista de contas; só admin edita nome e cor
    const resposta = await api<GetContaUsuario>(
      `/ContasUsuarios/${conta.idConta}/associados?IdUsuario=${user?.id}`,
      "GET",
    );
    setAdmin(resposta.dados?.conteudo[0]?.permissao === PERMISSAO_ADMIN);
  };

  const executar = async (rota: string, mensagemErro: string) => {
    setAncoraMenu(null);
    const resposta = await api<string>(rota, "POST");
    if (resposta.sucesso) onAlterada();
    else setErro(resposta.erro ?? mensagemErro);
  };

  const ativa = conta.status === 0;
  const corTexto = corDoTexto(conta.cor);

  const abrirConta = () => {
    if (!ativa) return;
    setConta(conta);
    navigate("/movimentacoes");
  };

  return (
    <Card
      elevation={0}
      onClick={abrirConta}
      role={ativa ? "button" : undefined}
      tabIndex={ativa ? 0 : undefined}
      aria-label={ativa ? `Abrir conta ${conta.titulo}` : undefined}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrirConta();
        }
      }}
      sx={{
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        bgcolor: conta.cor,
        backgroundImage: "none",
        color: corTexto,
        borderRadius: "16px",
        border: "1px solid rgba(49, 65, 88, 0.5)",
        cursor: ativa ? "pointer" : "default",
        transition:
          "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease",
        "&:hover": {
          transform: "scale(1.03)",
          boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)",
        },
        "&:focus-visible": {
          outline: `2px solid ${corTexto}`,
          outlineOffset: 2,
        },
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Icon>account_balance_wallet</Icon>
        <Typography
          noWrap
          title={conta.titulo}
          sx={{
            flex: 1,
            minWidth: 0,
            fontSize: 14,
            fontWeight: 600,
            color: "inherit",
          }}
        >
          {conta.titulo}
        </Typography>
        {!conta.somaSaldo && (
          <Tooltip title="Não contabilizado no patrimônio total">
            {/* focável para quem usa teclado também ver a dica */}
            <Box
              component="span"
              tabIndex={0}
              role="img"
              aria-label="Não contabilizado no patrimônio total"
              sx={{ display: "flex", opacity: 0.85, cursor: "help" }}
            >
              <Icon fontSize="small">money_off</Icon>
            </Box>
          </Tooltip>
        )}
        {ativa && (
          // Barra cliques e teclas do menu (inclusive do portal) para não abrir a conta.
          <Box
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            sx={{ display: "flex", mr: -1 }}
          >
            <IconButton
              size="small"
              color="inherit"
              aria-label={`Opções da conta ${conta.titulo}`}
              aria-haspopup="menu"
              aria-expanded={Boolean(ancoraMenu)}
              onClick={(e) => abrirMenu(e.currentTarget)}
            >
              <Icon>more_vert</Icon>
            </IconButton>
            <Menu
              anchorEl={ancoraMenu}
              open={Boolean(ancoraMenu)}
              onClose={() => setAncoraMenu(null)}
            >
              <MenuItem
                onClick={() =>
                  executar(
                    `/ContasUsuarios/${conta.idConta}/Favorita`,
                    "Não foi possível favoritar a conta.",
                  )
                }
              >
                <ListItemIcon>
                  <Icon fontSize="small">
                    {conta.contaFavorita ? "star" : "star_border"}
                  </Icon>
                </ListItemIcon>
                <ListItemText>
                  {conta.contaFavorita ? "Remover dos favoritos" : "Favoritar"}
                </ListItemText>
              </MenuItem>
              <MenuItem
                role="menuitemcheckbox"
                aria-checked={conta.somaSaldo}
                onClick={() =>
                  executar(
                    `/ContasUsuarios/${conta.idConta}/AutoSoma`,
                    "Não foi possível alterar a soma do saldo.",
                  )
                }
              >
                <ListItemIcon>
                  <Icon fontSize="small">
                    {conta.somaSaldo ? "check_box" : "check_box_outline_blank"}
                  </Icon>
                </ListItemIcon>
                <ListItemText>Somar saldo na tela inicial</ListItemText>
              </MenuItem>
              {admin && (
                <MenuItem
                  onClick={() => {
                    setAncoraMenu(null);
                    onEditar();
                  }}
                >
                  <ListItemIcon>
                    <Icon fontSize="small">edit</Icon>
                  </ListItemIcon>
                  <ListItemText>Editar nome e cor</ListItemText>
                </MenuItem>
              )}
            </Menu>
            <Snackbar
              open={Boolean(erro)}
              autoHideDuration={5000}
              onClose={() => setErro(null)}
            >
              <Alert severity="error" onClose={() => setErro(null)}>
                {erro}
              </Alert>
            </Snackbar>
          </Box>
        )}
      </Stack>

      {/* Saldo à esquerda; receitas e despesas empilhadas à direita */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "flex-end", justifyContent: "space-between" }}
      >
        <Stack spacing={1.5} sx={{ minWidth: 0 }}>
          <Box>
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: 700,
                color: ativa ? "inherit" : COR_SALDO_INATIVO,
                textDecoration: ativa ? "none" : "line-through",
              }}
            >
              {exibirMoeda(conta.saldoAtual, ocultarValores)}
            </Typography>
            {conta.expiracao && (
              <Typography sx={{ fontSize: 12, color: "inherit", opacity: 0.8 }}>
                Válida até {formatarDataHora(conta.expiracao)}
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <Icon sx={{ fontSize: 12 }}>account_balance</Icon>
            <Typography sx={{ fontSize: 12, color: "inherit" }}>
              Corrente
            </Typography>
          </Stack>
        </Stack>

        {ativa && (
          <Stack spacing={1} sx={{ flexShrink: 0 }}>
            <Indicador
              icone="arrow_upward"
              rotulo="Receitas"
              valor={conta.entradaPendente}
              oculto={ocultarValores}
            />
            <Indicador
              icone="arrow_downward"
              rotulo="Despesas"
              valor={conta.saidaPendente}
              oculto={ocultarValores}
            />
          </Stack>
        )}
      </Stack>
    </Card>
  );
};

export default ContaComponent;
