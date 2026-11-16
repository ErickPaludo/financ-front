import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  ButtonBase,
  Divider,
  Drawer,
  Icon,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { AuthContext } from "../../contexts/AuthContext";
import { ContaContext } from "../../contexts/ContaContext";
import type {
  ContaBancaria,
  ContaResponse,
} from "../../models/contas-usuarios/GetContasBancarias";
import api from "../../services/api/apiConnect";
import MsgBox from "../../props/msg-box/MsgBox";
import { TypeMsgBox } from "../../props/msg-box/TypeMsgBox";
import APP_VERSION from "../../version";
import { BarraLateralClara, CoresClaro, CoresEscuro } from "../../cores";
import type { ModoCor } from "../../tema";
import logoAzul from "../../assets/pldprojects-logo-azul.svg";
import logoBranca from "../../assets/pldprojects-logo-azul-clara.svg";

const LARGURA = 260;
const LARGURA_RECOLHIDA = 68;
const ALTURA_ITEM = 34; // itens do menu
const TAMANHO_AVATAR = 40; // logo e avatar do usuário
const ALTURA_TOPO_MOBILE = 60; // .pagina-central desconta essa altura no celular
const ROTAS_DA_CONTA = ["/membros", "/agendadas"];
const ehRotaDaConta = (rota: string) =>
  ROTAS_DA_CONTA.includes(rota) || rota.endsWith("/contabancaria");

// Iguais nos dois modos: texto sobre o azul primário e "Deslogar" (no menu, fora da barra).
const COR_SOBRE_GRADIENTE = "#fff";
const COR_PERIGO = "#ff4b4b";

type Item = { rota: string; titulo: string; icone: string };

type PropBarraLateral = {
  modo: ModoCor;
  onAlternarModo: () => void;
  onSairDaConta: () => void;
  onDeslogar: () => void;
};

// Menu do app: barra lateral recolhível no desktop, barra superior + gaveta no celular.
const BarraLateral: React.FC<PropBarraLateral> = ({
  modo,
  onAlternarModo,
  onSairDaConta,
  onDeslogar,
}) => {
  const { user } = useContext(AuthContext);
  const cores = useTheme().palette.mode === "dark" ? CoresEscuro : CoresClaro;
  const rotaAtual = useLocation().pathname;
  // no modo claro a barra é branca em todas as telas; só mudam as cores
  const barra = cores === CoresClaro ? BarraLateralClara : cores.barraLateral;

  const nomeUsuario = user?.nomeCompleto || "Usuário";
  // Iniciais do primeiro e do último nome: "Erick Augusto Paludo" -> "EP".
  const palavrasNome = nomeUsuario.trim().split(/\s+/);
  const iniciais = (
    palavrasNome[0][0] +
    (palavrasNome.length > 1 ? palavrasNome[palavrasNome.length - 1][0] : "")
  ).toUpperCase();
  const { conta, usuario, setConta, versaoContas } = useContext(ContaContext);
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:768px)");
  const [recolhida, setRecolhida] = useState(false);
  const [mobileAberto, setMobileAberto] = useState(false);
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  // elemento onde o menu do usuário abre (o próprio cartão); null = fechado
  const [ancoraMenuUsuario, setAncoraMenuUsuario] =
    useState<HTMLElement | null>(null);

  const [favoritas, setFavoritas] = useState<ContaBancaria[]>([]);

  const compacta = recolhida && !isMobile;

  // Rebusca ao navegar e ao trocar a conta: favoritar acontece em outras telas.
  useEffect(() => {
    let ativo = true;
    api<ContaResponse>("/ContasUsuarios", "GET").then((resposta) => {
      if (ativo && resposta.sucesso && resposta.dados)
        setFavoritas(
          // só ativas: inativas não abrem (igual ao card da tela inicial)
          resposta.dados.conteudo.contas.filter(
            (c) => c.contaFavorita && c.status === 0,
          ),
        );
    });
    return () => {
      ativo = false;
    };
  }, [rotaAtual, conta, versaoContas]);

  const irPara = (rota: string) => {
    navigate(rota);
    setMobileAberto(false);
  };

  const abrirConta = (contaFavorita: ContaBancaria) => {
    setConta(contaFavorita);
    irPara(`/${contaFavorita.idConta}/contabancaria`);
  };

  const menu: Item[] = [
    { rota: "/inicial", titulo: "Contas", icone: "account_balance" },
    ...(conta
      ? [
          {
            rota: `/${conta.idConta}/contabancaria`,
            titulo: conta.titulo,
            icone: "wallet",
          },
        ]
      : []),
    { rota: "/convites", titulo: "Convites", icone: "person_add" },
  ];

  const opcoesConta: Item[] = [
    ...(usuario?.permissao !== 2
      ? [{ rota: "/agendadas", titulo: "Agendadas", icone: "browse_gallery" }]
      : []),
    { rota: "/membros", titulo: "Membros da Conta", icone: "group" }
  ];

  const titulo = (texto: string) =>
    !compacta && (
      <ListSubheader
        disableSticky
        sx={{
          bgcolor: "transparent",
          color: barra.apoio,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
          lineHeight: "32px",
        }}
      >
        {texto}
      </ListSubheader>
    );

  const botao = (
    texto: string,
    icone: string,
    onClick: () => void,
    selecionado = false,
    cor?: string,
  ) => (
    <Tooltip key={texto} title={compacta ? texto : ""} placement="right">
      <ListItemButton
        selected={selecionado}
        onClick={onClick}
        sx={{
          borderRadius: 1,
          mb: 0.25,
          height: ALTURA_ITEM,
          flexGrow: 0, // o padrão do MUI (1) esticava os itens dentro da List em coluna
          py: 0,
          justifyContent: compacta ? "center" : "flex-start",
          color: cor ?? barra.item,
          "&:hover": {
            bgcolor: barra.itemHover,
            color: cor ?? barra.itemHoverTexto,
          },
          "&.Mui-selected, &.Mui-selected:hover": {
            background: barra.itemAtivo,
            color: COR_SOBRE_GRADIENTE,
          },
        }}
      >
        <ListItemIcon
          sx={{ minWidth: 0, mr: compacta ? 0 : 1.5, color: "inherit" }}
        >
          <Icon>{icone}</Icon>
        </ListItemIcon>
        {!compacta && (
          <ListItemText
            primary={texto}
            sx={{ my: 0 }}
            slotProps={{
              primary: { noWrap: true, sx: { fontSize: 13, fontWeight: 500 } },
            }}
          />
        )}
      </ListItemButton>
    </Tooltip>
  );

  const item = ({ rota, titulo, icone }: Item) =>
    botao(titulo, icone, () => irPara(rota), rotaAtual === rota);

  // Só o SVG, sem quadro: azul-escuro na barra branca, branco na barra escura.
  const logo = (tamanho: number) => (
    <Box
      component="img"
      src={modo === "claro" ? logoAzul : logoBranca}
      alt="" // decorativa: o nome FinancHub está ao lado
      sx={{
        width: tamanho,
        height: tamanho,
        flexShrink: 0,
        objectFit: "contain",
        // o desenho pesa embaixo (centro de massa ~14% abaixo do centro do SVG): sobe para parecer centralizado
        transform: "translateY(-10%)",
      }}
    />
  );

  const conteudo = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ButtonBase
        onClick={() => irPara("/inicial")}
        aria-label="FinancHub: ir para a tela inicial"
        sx={{
          height: 100,
          px: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: compacta ? "center" : "flex-start",
          gap: 1.5,
          textAlign: "left",
        }}
      >
        {logo(TAMANHO_AVATAR)}
        {!compacta && (
          <Box sx={{ overflow: "hidden" }}>
            <Typography
              noWrap
              sx={{ fontSize: 17, fontWeight: 700, color: barra.titulo }}
            >
              FinancHub
            </Typography>
            <Typography noWrap sx={{ fontSize: 11, color: barra.apoio }}>
              Gestão Inteligente
            </Typography>
          </Box>
        )}
      </ButtonBase>

      <Divider sx={{ borderColor: barra.divisoria }} />

      <List
        component="nav"
        sx={{
          flex: 1,
          px: 1,
          pt: 2.5,
          pb: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {titulo("Menu")}
        {menu.map(item)}

        {favoritas.length > 0 && (
          <>
            {titulo("Favoritos")}
            {compacta && <Divider sx={{ my: 1, borderColor: barra.divisoria }} />}
            {favoritas.map((c) =>
              botao(c.titulo, "wallet", () => abrirConta(c)),
            )}
          </>
        )}

        {conta && ehRotaDaConta(rotaAtual) && (
          <Box sx={{ mt: "auto", pt: 2 }}>
            {opcoesConta.map(item)}
            {botao(
              "Sair da Conta",
              "exit_to_app",
              () => setConfirmarSaida(true),
              false,
              barra.perigo,
            )}
          </Box>
        )}
      </List>

      <Typography
        sx={{
          textAlign: "right",
          p: 0.6,
          fontSize: 11,
          color: barra.apoio,
        }}
      >
        {APP_VERSION.toString()}
      </Typography>
      {/* Rodapé: cartão do usuário; ao clicar abre as opções do usuário */}
      <Box
        sx={{
          p: 1,
          bgcolor: barra.rodape,
          borderTop: `1px solid ${barra.divisoria}`,
        }}
      >
        <Tooltip
          title={
            compacta
              ? `${nomeUsuario}${user?.email ? ` · ${user.email}` : ""}`
              : ""
          }
          placement="right"
        >
          <ListItemButton
            onClick={(e) => setAncoraMenuUsuario(e.currentTarget)}
            aria-haspopup="menu"
            aria-expanded={Boolean(ancoraMenuUsuario)}
            aria-controls={ancoraMenuUsuario ? "menu-usuario" : undefined}
            aria-label="Opções do usuário"
            sx={{
              p: compacta ? 1 : 1.25,
              gap: 1.25,
              justifyContent: compacta ? "center" : "flex-start",
              // direto na barra: sem fundo próprio, só o realce ao passar o mouse
              borderRadius: 1,
              "&:hover": { bgcolor: barra.itemHover },
            }}
          >
            <Avatar
              sx={{
                bgcolor: cores.primaria.principal,
                color: COR_SOBRE_GRADIENTE,
                fontSize: 14,
                fontWeight: 700,
                width: TAMANHO_AVATAR,
                height: TAMANHO_AVATAR,
              }}
            >
              {iniciais}
            </Avatar>
            {!compacta && (
              <>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    noWrap
                    title={nomeUsuario}
                    sx={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: barra.titulo,
                      lineHeight: 1.3,
                    }}
                  >
                    {nomeUsuario}
                  </Typography>
                  {user?.email && (
                    <Typography
                      noWrap
                      title={user.email}
                      sx={{
                        fontSize: 12,
                        color: barra.apoio,
                        lineHeight: 1.3,
                      }}
                    >
                      {user.email}
                    </Typography>
                  )}
                </Box>
                <Icon sx={{ color: barra.apoio }}>unfold_more</Icon>
              </>
            )}
          </ListItemButton>
        </Tooltip>

        <Menu
          id="menu-usuario"
          anchorEl={ancoraMenuUsuario}
          open={Boolean(ancoraMenuUsuario)}
          onClose={() => setAncoraMenuUsuario(null)}
          anchorOrigin={{
            vertical: "top",
            horizontal: compacta ? "right" : "center",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: compacta ? "left" : "center",
          }}
          slotProps={{ paper: { sx: { minWidth: 220, mb: 1 } } }}
        >
          <MenuItem
            selected={rotaAtual === "/usuario"}
            onClick={() => {
              setAncoraMenuUsuario(null);
              irPara("/usuario");
            }}
          >
            <ListItemIcon>
              <Icon fontSize="small">manage_accounts</Icon>
            </ListItemIcon>
            <ListItemText>Opções de usuário</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAncoraMenuUsuario(null);
              onAlternarModo();
            }}
          >
            <ListItemIcon>
              <Icon fontSize="small">
                {modo === "escuro" ? "light_mode" : "dark_mode"}
              </Icon>
            </ListItemIcon>
            <ListItemText>
              {modo === "escuro" ? "Modo claro" : "Modo escuro"}
            </ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              setAncoraMenuUsuario(null);
              onDeslogar();
            }}
            sx={{ color: COR_PERIGO }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <Icon fontSize="small">logout</Icon>
            </ListItemIcon>
            <ListItemText>Deslogar</ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      {confirmarSaida && (
        <MsgBox
          title="Sair da Conta"
          description="Deseja realmente sair da conta?"
          type={TypeMsgBox.Question}
          onQuestion={(confirmou: boolean) => {
            if (confirmou) onSairDaConta();
            setConfirmarSaida(false);
          }}
        />
      )}
    </Box>
  );

  const fundoGaveta = {
    bgcolor: barra.fundo,
    backgroundImage: "none",
    // contorno marcado: separa a barra do fundo azul da área central
    borderRight: `1px solid ${barra.contorno}`,
  };

  if (isMobile) {
    return (
      <>
        <AppBar
          position="static"
          elevation={0}
          sx={{
            ...fundoGaveta,
            color: barra.titulo, // o padrão do AppBar é branco, que some na barra clara
            borderRight: 0,
            borderBottom: fundoGaveta.borderRight,
          }}
        >
          <Toolbar
            sx={{ minHeight: `${ALTURA_TOPO_MOBILE}px !important`, gap: 1.25 }}
          >
            {logo(28)}
            <Typography
              onClick={() => irPara("/inicial")}
              sx={{ flex: 1, fontSize: 18, fontWeight: 700, cursor: "pointer" }}
            >
              FinancHub
            </Typography>
            <IconButton
              color="inherit"
              aria-label="Abrir menu"
              onClick={() => setMobileAberto(true)}
            >
              <Icon>menu</Icon>
            </IconButton>
          </Toolbar>
        </AppBar>
        <Drawer
          open={mobileAberto}
          onClose={() => setMobileAberto(false)}
          slotProps={{
            paper: { sx: { ...fundoGaveta, width: "85%", maxWidth: 300 } },
          }}
        >
          {conteudo}
        </Drawer>
      </>
    );
  }

  const largura = recolhida ? LARGURA_RECOLHIDA : LARGURA;
  return (
    <Box sx={{ position: "relative", flexShrink: 0 }}>
      <Drawer
        variant="permanent"
        sx={{
          width: largura,
          height: "100%",
          transition: "width .3s",
          "& .MuiDrawer-paper": {
            ...fundoGaveta,
            boxShadow: "4px 0 16px rgba(2, 8, 23, 0.3)",
            position: "relative",
            width: largura,
            overflowX: "hidden",
            transition: "width .3s",
          },
        }}
      >
        {conteudo}
      </Drawer>
      <IconButton
        size="small"
        onClick={() => setRecolhida((v) => !v)}
        aria-label={recolhida ? "Expandir menu" : "Recolher menu"}
        title={recolhida ? "Expandir menu" : "Recolher menu"}
        sx={{
          position: "absolute",
          top: "50%",
          right: -13,
          transform: "translateY(-50%)",
          zIndex: (t) => t.zIndex.drawer + 1,
          width: 26,
          height: 26,
          // mesmas cores da barra; destaque em azul primário, como o item ativo
          bgcolor: barra.fundo,
          border: `1px solid ${barra.divisoria}`,
          color: barra.item,
          "&:hover": {
            bgcolor: cores.primaria.principal,
            color: COR_SOBRE_GRADIENTE,
          },
        }}
      >
        <Icon sx={{ fontSize: 16 }}>
          {recolhida ? "chevron_right" : "chevron_left"}
        </Icon>
      </IconButton>
    </Box>
  );
};

export default BarraLateral;
