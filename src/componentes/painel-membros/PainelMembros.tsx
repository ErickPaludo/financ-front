import { useContext, useState } from "react";
import {
  Avatar,
  Box,
  Icon,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Tooltip,
} from "@mui/material";

import type {
  ContaUsuario,
  GetContaUsuario,
} from "../../models/contas-usuarios/GetContaUsuario";
import { AuthContext } from "../../contexts/AuthContext";
import { ContaContext } from "../../contexts/ContaContext";
import { useBuscaApi } from "../../hooks/useBuscaApi";
import type { CoresBarraLateral } from "../../cores";
import { useCoresBarra } from "../../hooks/useCoresBarra";
import {
  CabecalhoPainel,
  DetalhePainel as Detalhe,
  EstadoLista,
} from "../painel-lateral/PainelLateral";
import EditMembro from "./EditMembro";
import { formatarDataHora, iniciais } from "../../utils/formatacao";
import {
  iconePermissao,
  nomePermissao,
  PERMISSAO,
} from "../../utils/permissao";

// Conteúdo do painel lateral de membros da conta selecionada (a barra lateral o abre no PainelLateral).
// O mestre edita os membros (gaveta EditMembro); convidar fica no painel de convites.
const PainelMembros: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const barra = useCoresBarra();
  const { conta, usuario } = useContext(ContaContext);
  const { user } = useContext(AuthContext);
  const {
    dados,
    erro,
    carregando,
    buscar: buscarMembros,
  } = useBuscaApi<GetContaUsuario>(
    `/ContasUsuarios/${conta!.idConta}/associados`,
    "Não foi possível carregar os membros.",
  );
  const membros = dados?.conteudo ?? [];
  const [membroEditado, setMembroEditado] = useState<ContaUsuario | null>(
    null,
  );
  const ehMestre = usuario?.permissao === PERMISSAO.Mestre;

  // o próprio usuário primeiro
  const ordenados = [...membros].sort(
    (a, b) => Number(b.idUsuario === user?.id) - Number(a.idUsuario === user?.id),
  );

  return (
    <>
      <CabecalhoPainel
        avatar={<Icon>group</Icon>}
        titulo="Membros"
        subtitulo={
          <>
            {conta!.titulo}
            {!carregando && ` · ${membros.length} no total`}
          </>
        }
        onAtualizar={buscarMembros}
        onClose={onClose}
      />

      <Box sx={{ flex: 1, overflowY: "auto", px: 1, py: 1 }}>
        <EstadoLista
          carregando={carregando}
          vazio={membros.length === 0}
          erro={erro}
          icone="group_off"
          mensagem="Nenhum membro nesta conta."
        />

        <List disablePadding>
          {ordenados.map((membro) => (
            <ItemMembro
              key={membro.idContaUsuario}
              membro={membro}
              barra={barra}
              ehVoce={membro.idUsuario === user?.id}
              // o mestre edita os outros membros; a si mesmo e a outro mestre, não
              onEditar={
                ehMestre &&
                membro.idUsuario !== user?.id &&
                membro.permissao !== PERMISSAO.Mestre
                  ? () => setMembroEditado(membro)
                  : undefined
              }
            />
          ))}
        </List>
      </Box>

      <EditMembro
        membro={membroEditado}
        onClose={() => setMembroEditado(null)}
        onAlterado={buscarMembros}
      />
    </>
  );
};

const ItemMembro: React.FC<{
  membro: ContaUsuario;
  barra: CoresBarraLateral;
  ehVoce: boolean;
  onEditar?: () => void;
}> = ({ membro, barra, ehVoce, onEditar }) => {
  const nome = membro.nome || membro.email;
  const inativo = membro.status !== 0;

  return (
    <ListItem
      sx={{
        borderRadius: 1,
        pr: onEditar ? 7 : 1.5,
        opacity: inativo ? 0.6 : 1,
        "&:hover": { bgcolor: barra.itemHover },
      }}
      secondaryAction={
        onEditar && (
          <Tooltip title="Editar membro">
            <IconButton
              edge="end"
              aria-label={`Editar ${nome}`}
              onClick={onEditar}
              sx={{ color: barra.item }}
            >
              <Icon>edit</Icon>
            </IconButton>
          </Tooltip>
        )
      }
    >
      <ListItemAvatar sx={{ minWidth: 52 }}>
        <Avatar
          sx={{
            width: 38,
            height: 38,
            fontSize: 14,
            fontWeight: 700,
            bgcolor: ehVoce ? barra.itemAtivo : barra.divisoria,
            color: ehVoce ? "common.white" : barra.titulo,
          }}
        >
          {iniciais(nome)}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <>
            {nome}
            {ehVoce && (
              <Box component="span" sx={{ color: barra.apoio, fontWeight: 400 }}>
                {" "}
                (você)
              </Box>
            )}
          </>
        }
        secondary={
          <Stack
            component="span"
            direction="row"
            sx={{ flexWrap: "wrap", alignItems: "center", columnGap: 1.25, rowGap: 0.25, mt: 0.25 }}
          >
            <Detalhe icone={iconePermissao(membro.permissao)}>
              {nomePermissao(membro.permissao)}
            </Detalhe>
            {inativo && <Detalhe icone="block">Inativo</Detalhe>}
            {membro.expiracao && (
              <Detalhe icone="schedule">
                até {formatarDataHora(membro.expiracao)}
              </Detalhe>
            )}
          </Stack>
        }
        slotProps={{
          primary: { noWrap: true, sx: { fontSize: 14, fontWeight: 600 } },
          secondary: { component: "span", sx: { fontSize: 12, color: barra.apoio } },
        }}
      />
    </ListItem>
  );
};

export default PainelMembros;
