import { useCallback, useContext, useEffect, useState } from "react";
import { Alert, Box, Button, Stack } from "@mui/material";

import Conecta from "../../services/api/apiConnect";
import type {
  ContaUsuario,
  GetContaUsuario,
} from "../../models/contas-usuarios/GetContaUsuario";
import { ContaContext } from "../../contexts/ContaContext";
import { AuthContext } from "../../contexts/AuthContext";
import TabelaDados, {
  type ColunaTabela,
} from "../../componentes/tabela-dados/TabelaDados";
import TituloPagina from "../../componentes/titulo-pagina/TituloPagina";
import Modal from "../../componentes/modal/Modal";
import EditMembro from "./edit-membro/EditMembro";
import { formatarDataHora } from "../../utils/formatacao";
import { nomePermissao, PERMISSAO } from "../../utils/permissao";

const linhaDoMembro = (membro: ContaUsuario) => ({
  membro,
  email: membro.email,
  acesso: nomePermissao(membro.permissao),
  status: membro.status === 0 ? "Ativo" : "Inativo",
  dtExpiracao: membro.expiracao ? formatarDataHora(membro.expiracao) : "",
});

type LinhaMembro = ReturnType<typeof linhaDoMembro>;

const COLUNAS: ColunaTabela<LinhaMembro>[] = [
  { titulo: "Email", chave: "email" },
  { titulo: "Acesso", chave: "acesso" },
  { titulo: "Status", chave: "status" },
  { titulo: "Data Expiração", chave: "dtExpiracao" },
];

// Membros da conta selecionada (sem o próprio usuário). O mestre edita clicando na linha.
const Membros = () => {
  const { conta, usuario } = useContext(ContaContext);
  const { user } = useContext(AuthContext);
  const idConta = conta!.idConta;
  // undefined = ainda buscando (a tabela mostra o carregamento)
  const [membros, setMembros] = useState<LinhaMembro[]>();
  // o membro continua guardado ao fechar para o formulário não sumir durante a animação
  const [gaveta, setGaveta] = useState<{
    aberta: boolean;
    membro: ContaUsuario | null;
  }>({ aberta: false, membro: null });
  const fecharGaveta = () => setGaveta((g) => ({ ...g, aberta: false }));

  const buscarMembros = useCallback(
    () =>
      Conecta<GetContaUsuario>(
        `/ContasUsuarios/${idConta}/associados`,
        "GET",
      ).then((resposta) =>
        setMembros(
          resposta.dados?.conteudo
            .filter((m) => m.idUsuario !== user?.id)
            .map(linhaDoMembro) ?? [],
        ),
      ),
    [idConta, user?.id],
  );

  useEffect(() => {
    buscarMembros();
  }, [buscarMembros]);

  return (
    <Stack spacing={2}>
      <Modal
        aberto={gaveta.aberta}
        titulo="Alterar usuário"
        onClose={fecharGaveta}
      >
        {gaveta.membro && (
          <EditMembro
            membro={gaveta.membro}
            onClose={() => {
              fecharGaveta();
              buscarMembros();
            }}
          />
        )}
      </Modal>

      <TituloPagina
        titulo={`Membros da ${conta!.titulo}`}
        subtitulo={
          usuario &&
          `${user?.primeiroNome}, você é o ${nomePermissao(usuario.permissao)} dessa conta!`
        }
      />

      {usuario?.expiracao && (
        <Alert severity="warning" sx={{ maxWidth: 500 }}>
          Sua conta vai expirar: {formatarDataHora(usuario.expiracao)}
        </Alert>
      )}

      <TabelaDados
        titulo="Membros"
        idPreferencias="membros"
        linhas={membros ?? []}
        carregando={membros === undefined}
        colunas={COLUNAS}
        onClicarLinha={({ membro }) => {
          if (usuario?.permissao === PERMISSAO.Mestre)
            setGaveta({ aberta: true, membro });
        }}
      />

      <Box sx={{ alignSelf: "flex-end" }}>
        <Button variant="contained" onClick={buscarMembros}>
          Atualizar
        </Button>
      </Box>
    </Stack>
  );
};

export default Membros;
