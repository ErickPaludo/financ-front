import type { ReactNode } from "react";
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  Divider,
  Drawer,
  Icon,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { useCoresBarra } from "../../hooks/useCoresBarra";

const LARGURA = 340;

type PropPainelLateral = {
  aberto: boolean;
  onClose: () => void;
  // largura da barra lateral: o painel abre colado nela (0 no celular, onde ocupa a tela)
  deslocamento: number;
  rotulo: string; // nome do painel para leitores de tela
  // largura máxima em px (padrão 340); painéis com tabela usam mais. Nunca passa da tela.
  largura?: number;
  children: ReactNode; // começa com o CabecalhoPainel
};

// Subpainel que surge ao lado da barra lateral (membros, agendadas, convites, opções do usuário).
// Persistente: sem fundo escuro, a barra continua clicável. O conteúdo só existe com o painel
// aberto (desmonta ao fechar), então buscas e formulários começam do zero a cada abertura.
const PainelLateral: React.FC<PropPainelLateral> = ({
  aberto,
  onClose,
  deslocamento,
  rotulo,
  largura = LARGURA,
  children,
}) => {
  const barra = useCoresBarra();

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={aberto}
      slotProps={{
        transition: { unmountOnExit: true },
        paper: {
          role: "dialog",
          "aria-label": rotulo,
          // Esc fecha, como nas gavetas
          onKeyDown: (e: React.KeyboardEvent) => e.key === "Escape" && onClose(),
          sx: {
            left: deslocamento,
            width: {
              xs: "100%",
              sm: `min(${largura}px, calc(100vw - ${deslocamento}px))`,
            },
            zIndex: (t) => t.zIndex.drawer,
            bgcolor: barra.fundo,
            backgroundImage: "none",
            color: barra.titulo,
            borderRight: `1px solid ${barra.contorno}`,
            boxShadow: "8px 0 24px rgba(2, 8, 23, 0.25)",
          },
        },
      }}
    >
      <Stack sx={{ height: "100%" }}>{children}</Stack>
    </Drawer>
  );
};

type PropCabecalhoPainel = {
  avatar: ReactNode; // ícone (<Icon>) ou iniciais
  titulo: string;
  subtitulo?: ReactNode;
  onAtualizar?: () => void; // com ele, mostra o botão de atualizar
  onClose: () => void;
};

// Topo dos painéis laterais: avatar, título, subtítulo, atualizar e fechar; com a divisória embaixo.
export const CabecalhoPainel: React.FC<PropCabecalhoPainel> = ({
  avatar,
  titulo,
  subtitulo,
  onAtualizar,
  onClose,
}) => {
  const barra = useCoresBarra();
  const nome = titulo.toLowerCase();

  return (
    <>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: "center", px: 2, py: 2.5 }}
      >
        <Avatar
          sx={{
            bgcolor: barra.itemAtivo,
            color: "common.white",
            width: 40,
            height: 40,
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {avatar}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component="h2"
            noWrap
            sx={{ fontSize: 17, fontWeight: 700 }}
          >
            {titulo}
          </Typography>
          {subtitulo && (
            <Typography noWrap sx={{ fontSize: 12, color: barra.apoio }}>
              {subtitulo}
            </Typography>
          )}
        </Box>
        {onAtualizar && (
          <Tooltip title="Atualizar">
            <IconButton
              aria-label={`Atualizar ${nome}`}
              onClick={onAtualizar}
              sx={{ color: barra.item }}
            >
              <Icon>refresh</Icon>
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Fechar">
          <IconButton
            aria-label={`Fechar ${nome}`}
            onClick={onClose}
            sx={{ color: barra.item }}
          >
            <Icon>close</Icon>
          </IconButton>
        </Tooltip>
      </Stack>
      <Divider sx={{ borderColor: barra.divisoria }} />
    </>
  );
};

type PropEstadoLista = {
  carregando?: boolean;
  vazio?: boolean;
  erro?: string | null;
  icone?: string; // Material Icons da lista vazia
  mensagem?: string; // texto da lista vazia
};

// Erro, carregamento e lista vazia dos painéis (a lista em si vem depois, de quem usa).
export const EstadoLista: React.FC<PropEstadoLista> = ({
  carregando = false,
  vazio = false,
  erro,
  icone = "inbox",
  mensagem = "Nada por aqui.",
}) => {
  const barra = useCoresBarra();
  return (
    <>
      {erro && (
        <Alert severity="error" sx={{ m: 1 }}>
          {erro}
        </Alert>
      )}
      {carregando ? (
        <CircularProgress
          aria-label="Carregando"
          sx={{ display: "block", mx: "auto", my: 4 }}
        />
      ) : (
        vazio &&
        !erro && (
          <Stack sx={{ alignItems: "center", gap: 1, p: 3, color: barra.apoio }}>
            <Icon sx={{ fontSize: 36 }}>{icone}</Icon>
            <Typography sx={{ fontSize: 13 }}>{mensagem}</Typography>
          </Stack>
        )
      )}
    </>
  );
};

// Ícone pequeno + texto nas linhas dos painéis ("★ Mestre", "⏱ até 16/11/2026").
export const DetalhePainel: React.FC<{ icone: string; children: ReactNode }> = ({
  icone,
  children,
}) => (
  <Stack component="span" direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
    <Icon sx={{ fontSize: 14 }} aria-hidden>
      {icone}
    </Icon>
    {children}
  </Stack>
);

export default PainelLateral;
