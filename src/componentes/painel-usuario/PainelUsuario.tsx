import { useContext, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Collapse,
  Icon,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
} from "@mui/material";

import Conecta from "../../services/api/apiConnect";
import { AuthContext } from "../../contexts/AuthContext";
import { useEncerrarSessao } from "../../hooks/useEncerrarSessao";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import { useCoresBarra } from "../../hooks/useCoresBarra";
import CampoTexto from "../../props/campo-texto/CampoTexto";
import { validarConfirmacaoSenha } from "../../props/campo-texto/validacoes";
import { iniciais } from "../../utils/formatacao";
import { CabecalhoPainel } from "../painel-lateral/PainelLateral";
import TituloSecao from "../titulo-secao/TituloSecao";

const validarSenhaAtual = (senha: string) =>
  senha.trim() ? null : "Informe a senha atual.";

const validarSenhaNova = (senha: string) =>
  !senha.trim()
    ? "Informe a nova senha."
    : senha.length < 6
      ? "A nova senha deve ter pelo menos 6 caracteres."
      : null;

// opção expandida (uma por vez); novas opções entram aqui e num tópico abaixo
type Opcao = "senha";

// Conteúdo do painel lateral de opções do usuário logado, separadas por tópico.
// Ao fechar o painel o conteúdo desmonta: opções recolhidas e campos de senha vazios.
const PainelUsuario: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useContext(AuthContext);
  const nome = user?.nomeCompleto || "Usuário";
  const [expandida, setExpandida] = useState<Opcao | null>(null);
  const alternar = (opcao: Opcao) =>
    setExpandida((atual) => (atual === opcao ? null : opcao));

  return (
    <>
      <CabecalhoPainel
        avatar={iniciais(nome)}
        titulo={nome}
        subtitulo={user?.email}
        onClose={onClose}
      />

      <Box sx={{ flex: 1, overflowY: "auto", px: 1, py: 1.5 }}>
        <Topico titulo="Segurança">
          <OpcaoExpansivel
            icone="lock"
            titulo="Alterar senha"
            descricao="Você será deslogado depois da alteração"
            expandida={expandida === "senha"}
            onAlternar={() => alternar("senha")}
          >
            <FormularioSenha />
          </OpcaoExpansivel>
        </Topico>
      </Box>
    </>
  );
};

// Grupo de opções com o título em caixa alta, como as seções do menu da barra lateral.
const Topico: React.FC<{ titulo: string; children: ReactNode }> = ({
  titulo,
  children,
}) => {
  const barra = useCoresBarra();
  return (
    <List
      disablePadding
      aria-label={titulo}
      subheader={
        <TituloSecao component="li" cor={barra.apoio}>
          {titulo}
        </TituloSecao>
      }
      sx={{ mb: 1.5 }}
    >
      {children}
    </List>
  );
};

type PropOpcaoExpansivel = {
  icone: string; // Material Icons
  titulo: string;
  descricao?: string;
  expandida: boolean;
  onAlternar: () => void;
  children: ReactNode; // o que aparece ao expandir (ex.: formulário)
};

// Linha de uma opção; clicar expande o conteúdo logo abaixo.
const OpcaoExpansivel: React.FC<PropOpcaoExpansivel> = ({
  icone,
  titulo,
  descricao,
  expandida,
  onAlternar,
  children,
}) => {
  const barra = useCoresBarra();
  return (
    <>
      <ListItemButton
        onClick={onAlternar}
        aria-expanded={expandida}
        sx={{
          borderRadius: 1,
          color: barra.item,
          bgcolor: expandida ? barra.itemHover : undefined,
          "&:hover": { bgcolor: barra.itemHover, color: barra.itemHoverTexto },
        }}
      >
        <ListItemIcon sx={{ minWidth: 0, mr: 1.5, color: "inherit" }}>
          <Icon>{icone}</Icon>
        </ListItemIcon>
        <ListItemText
          primary={titulo}
          secondary={descricao}
          slotProps={{
            primary: { sx: { fontSize: 14, fontWeight: 600 } },
            secondary: { sx: { fontSize: 12, color: barra.apoio } },
          }}
        />
        <Icon sx={{ color: barra.apoio }}>
          {expandida ? "expand_less" : "expand_more"}
        </Icon>
      </ListItemButton>
      <Collapse in={expandida} unmountOnExit>
        <Box sx={{ px: 1, pt: 1.5, pb: 1 }}>{children}</Box>
      </Collapse>
    </>
  );
};

// Alterar a senha; depois de alterar, a sessão é encerrada e volta ao login.
const FormularioSenha: React.FC = () => {
  const encerrarSessao = useEncerrarSessao();

  const [senhaAntiga, setSenhaAntiga] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const validarConfirmacao = (confirmacao: string) =>
    confirmacao.trim()
      ? validarConfirmacaoSenha(senhaNova)(confirmacao)
      : "Confirme a nova senha.";

  const alterarSenha = async () => {
    // os erros aparecem nos próprios campos
    if (
      validarSenhaAtual(senhaAntiga) ||
      validarSenhaNova(senhaNova) ||
      validarConfirmacao(confirmarSenha)
    )
      return;

    const resposta = await Conecta<null>("/Usuarios/alterar_senha", "POST", {
      senhaAntiga,
      senhaNova,
    });
    if (!resposta.sucesso) return resposta.erro ?? "Erro ao alterar senha.";

    // a senha mudou: a sessão atual é encerrada
    setSucesso(true);
    await encerrarSessao();
  };

  const envio = useEnvioFormulario(alterarSenha);

  return (
    <Stack component="form" onSubmit={envio.enviar} noValidate spacing={2}>
      {/* o CampoTexto de senha já tem o botão de mostrar/ocultar */}
      <CampoTexto
        label="Senha atual"
        valor={senhaAntiga}
        setValor={setSenhaAntiga}
        type="password"
        autoComplete="current-password"
        placeholder="Digite sua senha atual"
        validar={validarSenhaAtual}
        mostrarErro={envio.tentouEnviar}
      />
      <CampoTexto
        label="Nova senha"
        valor={senhaNova}
        setValor={setSenhaNova}
        type="password"
        autoComplete="new-password"
        placeholder="Digite a nova senha"
        validar={validarSenhaNova}
        mostrarErro={envio.tentouEnviar}
      />
      <CampoTexto
        label="Confirmar nova senha"
        valor={confirmarSenha}
        setValor={setConfirmarSenha}
        type="password"
        autoComplete="new-password"
        placeholder="Confirme a nova senha"
        validar={validarConfirmacao}
        mostrarErro={envio.tentouEnviar}
      />

      {envio.erro && <Alert severity="error">{envio.erro}</Alert>}
      {sucesso && (
        <Alert severity="success">Senha alterada! Redirecionando...</Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        startIcon={<Icon>key</Icon>}
        disabled={envio.enviando}
      >
        {envio.enviando ? "Salvando..." : "Alterar senha"}
      </Button>
    </Stack>
  );
};

export default PainelUsuario;
