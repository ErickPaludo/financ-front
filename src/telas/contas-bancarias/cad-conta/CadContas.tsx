import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Drawer,
  Icon,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import { tema as temaEscuro } from "../../../tema";
import { CoresClaro, CoresEscuro } from "../../../cores";

import Conecta from "../../../services/api/apiConnect";
import CampoTexto from "../../../props/campo-texto/CampoTexto";
import SeletorCor from "../../../props/seletor-cor/SeletorCor";
import { existeCampoVazio } from "../../../props/campo-texto/validacoes";
import { useEnvioFormulario } from "../../../hooks/useEnvioFormulario";

const COR_INICIAL = "#314158";

type NovaContaRequest = { titulo: string; cor: string };

type Props = {
  aberto: boolean;
  onClose: () => void;
  buscaContas: () => void;
};

// Gaveta da direita para cadastrar uma conta bancária: nome, cor e prévia do card.
// Mesmas cores da barra lateral (fundo escuro nos dois modos), por isso usa o tema escuro.
// O conteúdo só existe com a gaveta aberta, então os campos voltam vazios a cada abertura.
const CadContas: React.FC<Props> = ({ aberto, onClose, buscaContas }) => {
  const barra = (useTheme().palette.mode === "dark" ? CoresEscuro : CoresClaro)
    .barraLateral;

  return (
    <ThemeProvider theme={temaEscuro}>
      <Drawer
        anchor="right"
        open={aberto}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 400 },
              bgcolor: barra.fundo,
              backgroundImage: "none",
              borderLeft: `1px solid ${barra.contorno}`,
              color: barra.titulo,
            },
          },
        }}
      >
        <FormularioNovaConta onClose={onClose} buscaContas={buscaContas} />
      </Drawer>
    </ThemeProvider>
  );
};

const FormularioNovaConta: React.FC<Omit<Props, "aberto">> = ({
  onClose,
  buscaContas,
}) => {
  const [titulo, setTitulo] = useState("");
  const [cor, setCor] = useState(COR_INICIAL);

  const cadastrar = async () => {
    if (existeCampoVazio(titulo)) return "Informe o nome da conta";

    const conta: NovaContaRequest = { titulo: titulo.trim(), cor };
    const resposta = await Conecta<string>("Contas", "POST", conta);
    if (!resposta.sucesso)
      return resposta.erro ?? "Não foi possível criar a conta";

    onClose();
    buscaContas();
  };

  const envio = useEnvioFormulario(cadastrar);

  return (
    <Stack
      component="form"
      onSubmit={envio.enviar}
      noValidate
      spacing={2.5}
      sx={{ p: 3, height: "100%" }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography component="h2" sx={{ fontSize: 20, fontWeight: 800 }}>
          Nova conta
        </Typography>
        <IconButton onClick={onClose} aria-label="Fechar">
          <Icon>close</Icon>
        </IconButton>
      </Stack>

      {/* prévia de como o card vai ficar */}
      <Box
        sx={{
          p: 2,
          borderRadius: "16px",
          bgcolor: cor,
          color: (t) => t.palette.getContrastText(cor),
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Icon>account_balance_wallet</Icon>
        <Typography noWrap sx={{ fontWeight: 600, color: "inherit" }}>
          {titulo.trim() || "Minha conta"}
        </Typography>
      </Box>

      <CampoTexto
        label="Nome da conta"
        placeholder="Ex: Minha Conta"
        autoFocus
        valor={titulo}
        setValor={setTitulo}
      />

      <SeletorCor rotulo="Cor da conta" valor={cor} setValor={setCor} />

      {envio.erro && <Alert severity="error">{envio.erro}</Alert>}

      <Box sx={{ flex: 1 }} />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={envio.enviando}
      >
        {envio.enviando ? "Cadastrando..." : "Cadastrar"}
      </Button>
    </Stack>
  );
};

export default CadContas;
