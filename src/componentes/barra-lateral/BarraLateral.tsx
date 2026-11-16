import { useContext, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Drawer,
  Icon,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { AuthContext } from "../../contexts/AuthContext";
import { ContaContext } from "../../contexts/ContaContext";
import MsgBox from "../../props/msg-box/MsgBox";
import { TypeMsgBox } from "../../props/msg-box/TypeMsgBox";
import APP_VERSION from "../../version";
import { Cores } from "../../cores";

const LARGURA = 260;
const LARGURA_RECOLHIDA = 68;
const ALTURA_ITEM = 34; // itens do menu e botão de deslogar
const TAMANHO_AVATAR = 40; // logo e avatar do usuário
const ALTURA_TOPO_MOBILE = 60; // .pagina-central desconta essa altura no celular
const TELAS_DA_CONTA = [1, 4, 5, 6];

type Item = { tela: number; titulo: string; icone: string };

type PropBarraLateral = {
  telaAtual: number;
  setTelaAtual: (tela: number) => void;
  onSairDaConta: () => void;
  onDeslogar: () => void;
};

// Menu do app: barra lateral recolhível no desktop, barra superior + gaveta no celular.
const BarraLateral: React.FC<PropBarraLateral> = ({
  telaAtual,
  setTelaAtual,
  onSairDaConta,
  onDeslogar,
}) => {
  const { user } = useContext(AuthContext);
  const { conta, usuario } = useContext(ContaContext);
  const isMobile = useMediaQuery("(max-width:768px)");
  const [recolhida, setRecolhida] = useState(false);
  const [mobileAberto, setMobileAberto] = useState(false);
  const [confirmarSaida, setConfirmarSaida] = useState(false);

  const compacta = recolhida && !isMobile;

  const irPara = (tela: number) => {
    setTelaAtual(tela);
    setMobileAberto(false);
  };

  const menu: Item[] = [
    { tela: 0, titulo: "Contas", icone: "account_balance" },
    ...(conta ? [{ tela: 1, titulo: conta.titulo, icone: "wallet" }] : []),
    { tela: 3, titulo: "Convites", icone: "person_add" },
  ];

  const opcoesConta: Item[] = [
    ...(usuario?.permissao !== 2
      ? [{ tela: 6, titulo: "Agendadas", icone: "browse_gallery" }]
      : []),
    { tela: 4, titulo: "Membros da Conta", icone: "group" },
    { tela: 5, titulo: "Configurações", icone: "settings" },
  ];

  const titulo = (texto: string) =>
    !compacta && (
      <ListSubheader
        disableSticky
        sx={{
          bgcolor: "transparent",
          color: Cores.borda,
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
          color: cor ?? Cores.secundaria.principal,
          "&.Mui-selected, &.Mui-selected:hover": {
            background: Cores.primaria.gradiente,
            color: Cores.texto,
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

  const item = ({ tela, titulo, icone }: Item) =>
    botao(titulo, icone, () => irPara(tela), telaAtual === tela);

  const logo = (
    <Avatar
      variant="rounded"
      sx={{ background: Cores.primaria.gradiente, borderRadius: 1, width: TAMANHO_AVATAR, height: TAMANHO_AVATAR }}
    >
      <Icon sx={{ color: Cores.texto }}>account_balance_wallet</Icon>
    </Avatar>
  );

  const conteudo = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box
        sx={{
          height: 100,
          px: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: compacta ? "center" : "flex-start",
          gap: 1.5,
        }}
      >
        {logo}
        {!compacta && (
          <Box sx={{ overflow: "hidden" }}>
            <Typography noWrap sx={{ fontSize: 17, fontWeight: 700 }}>
              FinancHub
            </Typography>
            <Typography noWrap sx={{ fontSize: 11, color: "#62748e" }}>
              Gestão Inteligente
            </Typography>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          mx: compacta ? 1 : 1.25,
          p: compacta ? 1.25 : 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: compacta ? "center" : "flex-start",
          gap: 1.25,
          borderRadius: "16px",
          border: "1px solid rgba(25, 60, 184, 0.3)",
          background:
            "linear-gradient(135deg, rgba(43,127,255,.2) 0%, rgba(97,95,255,.2) 100%)",
        }}
      >
        <Avatar
          variant="rounded"
          sx={{ background: Cores.primaria.gradiente, color: Cores.texto, borderRadius: 1, fontWeight: 600, width: TAMANHO_AVATAR, height: TAMANHO_AVATAR }}
        >
          {user?.nomeCompleto?.charAt(0) || "U"}
        </Avatar>
        {!compacta && (
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>
              {user?.nomeCompleto || "Usuário"}
            </Typography>
            <Typography noWrap sx={{ fontSize: 11, color: "#62748e" }}>
              {user?.email || "email@exemplo.com"}
            </Typography>
          </Box>
        )}
      </Box>

      <List component="nav" sx={{ flex: 1, px: 1, pt: 2.5, pb: 1, display: "flex", flexDirection: "column" }}>
        {titulo("Usuário")}
        {item({ tela: 7, titulo: "Opções de Usuário", icone: "manage_accounts" })}
        {titulo("Menu")}
        {menu.map(item)}

        {conta && TELAS_DA_CONTA.includes(telaAtual) && (
          <Box sx={{ mt: "auto", pt: 2 }}>
            {opcoesConta.map(item)}
            {botao("Sair da Conta", "exit_to_app", () => setConfirmarSaida(true), false, "#ff4b4b")}
          </Box>
        )}
      </List>

      <Typography sx={{ textAlign: "right", p: 0.6, fontSize: 11, color: "text.secondary" }}>
        {APP_VERSION.toString()}
      </Typography>
      <Box sx={{ p: 1, py: 2, borderTop: `1px solid ${Cores.fundo.superficie}` }}>
        <Tooltip title="Deslogar" placement="right">
          <Button
            fullWidth
            onClick={onDeslogar}
            startIcon={!compacta && <Icon>exit_to_app</Icon>}
            sx={{
              justifyContent: compacta ? "center" : "flex-start",
              height: ALTURA_ITEM,
              color: Cores.secundaria.principal,
              fontWeight: 500,
              "&:hover": { color: "#ff4b4b", bgcolor: "transparent" },
            }}
          >
            {compacta ? <Icon>exit_to_app</Icon> : "Deslogar"}
          </Button>
        </Tooltip>
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
    bgcolor: "#0f172b",
    backgroundImage: "none",
    borderRight: `1px solid ${Cores.fundo.superficie}`,
  };

  if (isMobile) {
    return (
      <>
        <AppBar
          position="static"
          elevation={0}
          sx={{ ...fundoGaveta, borderRight: 0, borderBottom: fundoGaveta.borderRight }}
        >
          <Toolbar sx={{ minHeight: `${ALTURA_TOPO_MOBILE}px !important`, gap: 1.25 }}>
            <Icon sx={{ color: "#2b7fff" }}>account_balance_wallet</Icon>
            <Typography
              onClick={() => irPara(0)}
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
          slotProps={{ paper: { sx: { ...fundoGaveta, width: "85%", maxWidth: 300 } } }}
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
          bgcolor: Cores.fundo.superficie,
          border: "1px solid #2d3f58",
          color: "#62748e",
          "&:hover": { bgcolor: "#2b7fff", color: Cores.texto },
        }}
      >
        <Icon sx={{ fontSize: 16 }}>{recolhida ? "chevron_right" : "chevron_left"}</Icon>
      </IconButton>
    </Box>
  );
};

export default BarraLateral;
