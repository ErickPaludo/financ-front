import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Icon,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

import { AuthContext } from "../../../contexts/AuthContext";
import { ContaContext } from "../../../contexts/ContaContext";
import type { ContaBancaria } from "../../../models/contas-usuarios/GetContasBancarias";
import Conecta from "../../../services/api/apiConnect";
import { buscarContaUsuario } from "../../../services/contas/contaUsuarioService";
import {
  exibirMoeda,
  formatarDataHora,
  iniciais,
} from "../../../utils/formatacao";
import { corParaTextoBranco } from "../../../utils/corCategoria";
import { PERMISSAO } from "../../../utils/permissao";

type PropBloco = {
  seta: string;
  rotulo: string;
  valor: number;
  receita: boolean;
  oculto: boolean;
};

// Bloco "↑ Receitas" / "↓ Despesas". Zerado fica neutro; oculto também, para a cor não revelar o valor.
const Bloco: React.FC<PropBloco> = ({
  seta,
  rotulo,
  valor,
  receita,
  oculto,
}) => {
  const neutro = oculto || valor === 0;
  const cor = (corNeutra: string, corReceita: string, corDespesa: string) =>
    neutro ? corNeutra : receita ? corReceita : corDespesa;

  return (
    <Box
      sx={{
        p: "10px 12px",
        borderRadius: "10px",
        minWidth: 0,
        bgcolor: cor(
          "var(--fnc-tx-barra-filtros)",
          "var(--fnc-tx-bloco-receita)",
          "var(--fnc-tx-bloco-despesa)",
        ),
      }}
    >
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 500,
          color: cor(
            "var(--fnc-tx-apoio)",
            "var(--fnc-tx-rotulo-receita)",
            "var(--fnc-tx-despesa-badge)",
          ),
        }}
      >
        {seta} {rotulo}
      </Typography>
      <Typography
        noWrap
        sx={{
          fontSize: 15,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          color: cor(
            "var(--fnc-tx-apoio)",
            "var(--fnc-tx-receita)",
            "var(--fnc-tx-despesa)",
          ),
        }}
      >
        {exibirMoeda(valor, oculto)}
      </Typography>
    </Box>
  );
};

type PropCardConta = {
  conta: ContaBancaria;
  ocultarValores?: boolean;
  onEditar: () => void; // abre a edição de nome e cor
  onAlterada: () => void; // depois de favoritar ou mudar a soma do saldo
};

// Card de uma conta bancária na tela inicial. Clicar abre as movimentações (só contas ativas).
const CardConta: React.FC<PropCardConta> = ({
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
  const [confirmarSaida, setConfirmarSaida] = useState(false);

  const abrirMenu = async (elemento: HTMLElement) => {
    setAncoraMenu(elemento);
    // a permissão não vem na lista de contas; só o mestre edita nome e cor
    const resposta = await buscarContaUsuario(conta.idConta, user?.id);
    setAdmin(resposta.dados?.conteudo[0]?.permissao === PERMISSAO.Mestre);
  };

  const executar = async (rota: string, mensagemErro: string) => {
    setAncoraMenu(null);
    const resposta = await Conecta<string>(rota, "POST");
    if (resposta.sucesso) onAlterada();
    else setErro(resposta.erro ?? mensagemErro);
  };

  const ativa = conta.status === 0;
  // a cor escolhida, escurecida se preciso para o texto branco do avatar
  const corConta = corParaTextoBranco(conta.cor);
  const descricao = [
    "Corrente",
    conta.contaFavorita && "Favorita",
    !conta.somaSaldo && "Fora do total", // antes: ícone de cifrão riscado
  ]
    .filter(Boolean)
    .join(" · ");

  const abrirConta = () => {
    if (!ativa) return;
    setConta(conta);
    navigate(`/${conta.idConta}/contabancaria`);
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
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "var(--fnc-tx-superficie)",
        backgroundImage: "none",
        color: "var(--fnc-tx-texto)",
        borderRadius: "16px",
        border: "1px solid var(--fnc-tx-borda)",
        cursor: ativa ? "pointer" : "default",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": ativa
          ? {
              transform: "translateY(-2px)",
              boxShadow: "0 8px 20px rgba(15, 30, 74, 0.12)",
            }
          : undefined,
        "&:focus-visible": {
          outline: "2px solid var(--fnc-tx-destaque)",
          outlineOffset: 2,
        },
      }}
    >
      {/* faixa na cor da conta */}
      <Box sx={{ height: 4, flexShrink: 0, bgcolor: corConta }} />

      <Stack spacing={2} sx={{ p: 2.5, pt: 2, flex: 1 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            aria-hidden
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: "10px",
              display: "grid",
              placeItems: "center",
              bgcolor: corConta,
              color: "var(--fnc-tx-sobre-destaque)", // branco; corConta garante contraste 4.5:1
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {iniciais(conta.titulo)}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              noWrap
              title={conta.titulo}
              sx={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--fnc-tx-texto)",
              }}
            >
              {conta.titulo}
            </Typography>
            <Typography
              noWrap
              sx={{ fontSize: 12, color: "var(--fnc-tx-apoio)" }}
            >
              {descricao}
            </Typography>
          </Box>
          {ativa && (
            // Barra cliques e teclas do menu (inclusive do portal) para não abrir a conta.
            <Box
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              sx={{ display: "flex", mr: -1 }}
            >
              <IconButton
                aria-label={`Opções da conta ${conta.titulo}`}
                aria-haspopup="menu"
                aria-expanded={Boolean(ancoraMenu)}
                onClick={(e) => abrirMenu(e.currentTarget)}
                sx={{ width: 44, height: 44, color: "var(--fnc-tx-apoio)" }}
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
                    {conta.contaFavorita
                      ? "Remover dos favoritos"
                      : "Favoritar"}
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
                      {conta.somaSaldo
                        ? "check_box"
                        : "check_box_outline_blank"}
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
                <Divider />
                <MenuItem
                  onClick={() => {
                    setAncoraMenu(null);
                    setConfirmarSaida(true);
                  }}
                  sx={{ color: "error.main" }}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <Icon fontSize="small">exit_to_app</Icon>
                  </ListItemIcon>
                  <ListItemText>Sair da conta</ListItemText>
                </MenuItem>
              </Menu>
              <Dialog
                open={confirmarSaida}
                onClose={() => setConfirmarSaida(false)}
                aria-labelledby={`sair-conta-${conta.idConta}`}
              >
                <DialogTitle id={`sair-conta-${conta.idConta}`}>
                  Sair da conta
                </DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    Deseja realmente sair da conta "{conta.titulo}"? Você
                    perderá o acesso a ela até receber um novo convite.
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setConfirmarSaida(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => {
                      setConfirmarSaida(false);
                      executar(
                        `/ContasUsuarios/${conta.idConta}/sair`,
                        "Não foi possível sair da conta.",
                      );
                    }}
                  >
                    Sair
                  </Button>
                </DialogActions>
              </Dialog>
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

        <Box>
          <Typography sx={{ fontSize: 12, color: "var(--fnc-tx-apoio)" }}>
            Saldo
          </Typography>
          <Typography
            sx={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
              color: ativa ? "var(--fnc-tx-texto)" : "var(--fnc-tx-apoio)",
              textDecoration: ativa ? "none" : "line-through",
            }}
          >
            {exibirMoeda(conta.saldoAtual, ocultarValores)}
          </Typography>
          {conta.expiracao && (
            <Typography sx={{ fontSize: 12, color: "var(--fnc-tx-apoio)" }}>
              Válida até {formatarDataHora(conta.expiracao)}
            </Typography>
          )}
        </Box>

        {ativa && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1,
              mt: "auto !important", // encosta no rodapé quando o card estica na linha
            }}
          >
            <Bloco
              seta="↑"
              rotulo="Receitas"
              valor={conta.entradaPendente}
              receita
              oculto={ocultarValores}
            />
            <Bloco
              seta="↓"
              rotulo="Despesas"
              valor={conta.saidaPendente}
              receita={false}
              oculto={ocultarValores}
            />
          </Box>
        )}
      </Stack>
    </Card>
  );
};

export default CardConta;
