import { useContext, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Divider,
  Icon,
  List,
  ListItem,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import Conecta from "../../services/api/apiConnect";
import type {
  ConviteItem,
  ConviteResponse,
} from "../../models/convite/ConviteResponse";
import { ContaContext } from "../../contexts/ContaContext";
import { useCoresBarra } from "../../hooks/useCoresBarra";
import type { CoresBarraLateral } from "../../cores";
import MsgBox from "../../props/msg-box/MsgBox";
import { useBuscaApi } from "../../hooks/useBuscaApi";
import { useContasMestre } from "../../hooks/useContasMestre";
import Modal from "../modal/Modal";
import CadConvite from "./CadConvite";
import {
  CabecalhoPainel,
  DetalhePainel,
  EstadoLista,
} from "../painel-lateral/PainelLateral";
import { formatarData, iniciais } from "../../utils/formatacao";
import { iconePermissao, nomePermissao } from "../../utils/permissao";

type Aba = "recebidos" | "enviados";

const situacao = (aceito: boolean | null) =>
  aceito === null
    ? { texto: "Pendente", icone: "schedule" }
    : aceito
      ? { texto: "Aceito", icone: "check_circle" }
      : { texto: "Recusado", icone: "cancel" };

// confirmação antes de recusar ou revogar (não dá para desfazer)
type Confirmacao = { item: ConviteItem; acao: "recusar" | "revogar" };

// Conteúdo do painel lateral de convites: recebidos (aceitar/recusar), enviados (revogar)
// e, para quem é mestre de alguma conta, "Convidar membro" com a escolha da conta.
const PainelConvites: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const barra = useCoresBarra();
  const { contasAlteradas } = useContext(ContaContext);
  const [aba, setAba] = useState<Aba>("recebidos");
  const recebidos = useBuscaApi<ConviteResponse>(
    "/Convites",
    "Não foi possível carregar os convites recebidos.",
  );
  const enviados = useBuscaApi<ConviteResponse>(
    "/Convites?remetente=true",
    "Não foi possível carregar os convites enviados.",
  );
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  // convite com uma ação em andamento (botões desabilitados)
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null);
  // só mestre convida: o botão aparece se o usuário for mestre de alguma conta
  const contasMestre = useContasMestre();
  const [conviteAberto, setConviteAberto] = useState(false);
  const [conviteEnviado, setConviteEnviado] = useState(false);

  const buscarConvites = () => Promise.all([recebidos.buscar(), enviados.buscar()]);

  const executar = async (item: ConviteItem, rota: string) => {
    setOcupado(item.convite.idConvite);
    setErroAcao(null);
    const resposta = await Conecta<unknown>(rota, "POST");
    setOcupado(null);
    if (!resposta.sucesso) {
      setErroAcao(resposta.erro ?? "Não foi possível concluir a ação.");
      return;
    }
    contasAlteradas(); // aceitar coloca uma conta nova na lista (barra e tela inicial)
    buscarConvites();
  };

  const responder = (item: ConviteItem, aceito: boolean) =>
    executar(
      item,
      `/Convites/entrar?idConvite=${item.convite.idConvite}&aceito=${aceito}`,
    );
  const revogar = (item: ConviteItem) =>
    executar(item, `/Convites/${item.convite.idConvite}/Revogar`);

  const listaRecebidos = recebidos.dados?.conteudo ?? [];
  const pendentesRecebidos = listaRecebidos.filter(
    (i) => i.convite.aceito === null,
  ).length;
  const busca = aba === "recebidos" ? recebidos : enviados;
  const lista = busca.dados?.conteudo ?? [];

  return (
    <>
      <CabecalhoPainel
        avatar={<Icon>mail</Icon>}
        titulo="Convites"
        subtitulo={
          !recebidos.carregando &&
          (pendentesRecebidos === 0
            ? "Nenhum convite aguardando resposta"
            : pendentesRecebidos === 1
              ? "1 convite aguardando sua resposta"
              : `${pendentesRecebidos} convites aguardando sua resposta`)
        }
        onAtualizar={buscarConvites}
        onClose={onClose}
      />

      <Tabs
        value={aba}
        onChange={(_, nova: Aba) => setAba(nova)}
        variant="fullWidth"
        sx={{
          borderBottom: `1px solid ${barra.divisoria}`,
          "& .MuiTab-root": { color: barra.item, minHeight: 44 },
        }}
      >
        <Tab
          value="recebidos"
          icon={<Icon fontSize="small">inbox</Icon>}
          iconPosition="start"
          label={`Recebidos${pendentesRecebidos ? ` (${pendentesRecebidos})` : ""}`}
        />
        <Tab
          value="enviados"
          icon={<Icon fontSize="small">send</Icon>}
          iconPosition="start"
          label="Enviados"
        />
      </Tabs>

      <Box sx={{ flex: 1, overflowY: "auto", px: 1, py: 1 }}>
        <EstadoLista
          carregando={busca.carregando}
          vazio={lista.length === 0}
          erro={erroAcao ?? busca.erro}
          icone={aba === "recebidos" ? "inbox" : "outgoing_mail"}
          mensagem={
            aba === "recebidos"
              ? "Nenhum convite recebido."
              : "Nenhum convite enviado."
          }
        />

        <List disablePadding>
          {lista.map((item) => (
            <ItemConvite
              key={item.convite.idConvite}
              item={item}
              enviado={aba === "enviados"}
              barra={barra}
              ocupado={ocupado === item.convite.idConvite}
              onAceitar={() => responder(item, true)}
              onRecusar={() => setConfirmacao({ item, acao: "recusar" })}
              onRevogar={() => setConfirmacao({ item, acao: "revogar" })}
            />
          ))}
        </List>
      </Box>

      {contasMestre && contasMestre.length > 0 && (
        <>
          <Divider sx={{ borderColor: barra.divisoria }} />
          <Box sx={{ p: 1.5 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Icon>person_add</Icon>}
              onClick={() => setConviteAberto(true)}
            >
              Convidar membro
            </Button>
          </Box>
        </>
      )}

      <Modal
        aberto={conviteAberto}
        titulo="Novo convite"
        onClose={() => setConviteAberto(false)}
      >
        <CadConvite
          contas={contasMestre ?? []}
          onClose={() => {
            setConviteAberto(false);
            setConviteEnviado(true);
            setAba("enviados"); // mostra o convite que acabou de sair
            enviados.buscar();
          }}
        />
      </Modal>

      <Snackbar
        open={conviteEnviado}
        autoHideDuration={4000}
        onClose={() => setConviteEnviado(false)}
      >
        <Alert severity="success" onClose={() => setConviteEnviado(false)}>
          Convite enviado
        </Alert>
      </Snackbar>

      {confirmacao && (
        <MsgBox
          tipo="pergunta"
          titulo={
            confirmacao.acao === "recusar" ? "Recusar convite" : "Revogar convite"
          }
          descricao={
            confirmacao.acao === "recusar"
              ? `Recusar o convite para a conta "${confirmacao.item.conta.titulo}"?`
              : `Revogar o convite de ${confirmacao.item.usuarioDestinatario.email}?`
          }
          aoResponder={(sim) => {
            if (sim) {
              if (confirmacao.acao === "recusar") responder(confirmacao.item, false);
              else revogar(confirmacao.item);
            }
            setConfirmacao(null);
          }}
        />
      )}
    </>
  );
};

type PropItemConvite = {
  item: ConviteItem;
  enviado: boolean; // aba "Enviados": mostra o destinatário e o "Revogar"
  barra: CoresBarraLateral;
  ocupado: boolean;
  onAceitar: () => void;
  onRecusar: () => void;
  onRevogar: () => void;
};

// Um convite: conta, quem enviou/recebeu, acesso, situação e datas; ações só enquanto pendente.
const ItemConvite: React.FC<PropItemConvite> = ({
  item,
  enviado,
  barra,
  ocupado,
  onAceitar,
  onRecusar,
  onRevogar,
}) => {
  const { convite, conta } = item;
  const pendente = convite.aceito === null;
  const status = situacao(convite.aceito);
  const pessoa = enviado ? item.usuarioDestinatario : item.usuarioRemetente;

  return (
    <ListItem
      sx={{
        borderRadius: 1,
        alignItems: "flex-start",
        gap: 1.5,
        opacity: pendente ? 1 : 0.7,
        "&:hover": { bgcolor: barra.itemHover },
      }}
    >
      <Avatar
        sx={{
          width: 38,
          height: 38,
          mt: 0.25,
          fontSize: 14,
          fontWeight: 700,
          bgcolor: pendente ? barra.itemAtivo : barra.divisoria,
          color: pendente ? "common.white" : barra.titulo,
        }}
      >
        {iniciais(conta.titulo)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
          {conta.titulo}
        </Typography>
        <Typography noWrap sx={{ fontSize: 12, color: barra.apoio }}>
          {enviado ? "Para " : "De "}
          {pessoa.email}
        </Typography>

        <Stack
          direction="row"
          sx={{
            flexWrap: "wrap",
            columnGap: 1.25,
            rowGap: 0.25,
            mt: 0.5,
            fontSize: 12,
            color: barra.apoio,
          }}
        >
          <DetalhePainel icone={iconePermissao(convite.acesso)}>
            {nomePermissao(convite.acesso)}
          </DetalhePainel>
          <DetalhePainel icone={status.icone}>{status.texto}</DetalhePainel>
          <DetalhePainel icone="event">
            {formatarData(convite.dataEnvio)} até{" "}
            {formatarData(convite.dataExpiracao)}
          </DetalhePainel>
        </Stack>

        {pendente && (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {enviado ? (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<Icon>block</Icon>}
                disabled={ocupado}
                onClick={onRevogar}
              >
                Revogar
              </Button>
            ) : (
              <>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Icon>check</Icon>}
                  disabled={ocupado}
                  onClick={onAceitar}
                >
                  Aceitar
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<Icon>close</Icon>}
                  disabled={ocupado}
                  onClick={onRecusar}
                >
                  Recusar
                </Button>
              </>
            )}
          </Stack>
        )}
      </Box>
    </ListItem>
  );
};

export default PainelConvites;
