import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Icon, Stack, Typography } from "@mui/material";

import Conecta from "../../services/api/apiConnect";
import type {
  ConviteItem,
  ConviteResponse,
  Usuario,
} from "../../models/convite/ConviteResponse";
import TabelaDados, {
  type ColunaTabela,
} from "../../componentes/tabela-dados/TabelaDados";
import TituloPagina from "../../componentes/titulo-pagina/TituloPagina";
import Carregamento from "../../componentes/carregamento/Carregamento";
import Modal from "../../componentes/modal/Modal";
import { nomePermissao } from "../../utils/permissao";

const formatarData = (data: string) => new Date(data).toLocaleDateString("pt-BR");

// usuario: o remetente nos recebidos, o destinatário nos enviados
const linhaDoConvite = (item: ConviteItem, usuario: Usuario) => ({
  item,
  conta: item.conta.titulo,
  usuario: usuario.email,
  acesso: nomePermissao(item.convite.acesso),
  status:
    item.convite.aceito === null
      ? "Pendente"
      : item.convite.aceito
        ? "Aceito"
        : "Recusado",
  dtEnvio: formatarData(item.convite.dataEnvio),
  dtExpiracao: formatarData(item.convite.dataExpiracao),
});

type LinhaConvite = ReturnType<typeof linhaDoConvite>;

const COLUNAS: ColunaTabela<LinhaConvite>[] = [
  { titulo: "Conta", chave: "conta" },
  { titulo: "Usuário", chave: "usuario" },
  { titulo: "Acesso", chave: "acesso" },
  { titulo: "Status", chave: "status" },
  { titulo: "Data Envio", chave: "dtEnvio" },
  { titulo: "Data Expiração", chave: "dtExpiracao" },
];

// recebido: aceitar ou recusar; enviado: revogar
type Acao = "responder" | "revogar";

const PERGUNTAS: Record<Acao, { pergunta: string; sim: string; nao: string }> = {
  responder: { pergunta: "Deseja entrar na conta?", sim: "Aceitar", nao: "Recusar" },
  revogar: { pergunta: "Deseja revogar o convite?", sim: "Sim", nao: "Não" },
};

const Convites = () => {
  const [recebidos, setRecebidos] = useState<LinhaConvite[]>();
  const [enviados, setEnviados] = useState<LinhaConvite[]>();
  const [selecionado, setSelecionado] = useState<{
    item: ConviteItem;
    acao: Acao;
  } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const buscarConvites = useCallback(
    () =>
      Promise.all([
        Conecta<ConviteResponse>("/Convites", "GET"),
        Conecta<ConviteResponse>("/Convites?remetente=true", "GET"),
      ]).then(([respostaRecebidos, respostaEnviados]) => {
        setRecebidos(
          respostaRecebidos.dados?.conteudo.map((i) =>
            linhaDoConvite(i, i.usuarioRemetente),
          ) ?? [],
        );
        setEnviados(
          respostaEnviados.dados?.conteudo.map((i) =>
            linhaDoConvite(i, i.usuarioDestinatario),
          ) ?? [],
        );
      }),
    [],
  );

  useEffect(() => {
    buscarConvites();
  }, [buscarConvites]);

  // atualiza as listas antes de perguntar: o convite pode ter mudado desde a última busca
  const abrir = (item: ConviteItem, acao: Acao) => {
    setSelecionado({ item, acao });
    setRecebidos(undefined);
    setEnviados(undefined);
    buscarConvites();
  };

  const fechar = () => {
    setSelecionado(null);
    setErro(null);
  };

  const executar = async (rota: string) => {
    const resposta = await Conecta<unknown>(rota, "POST");
    if (!resposta.sucesso || !resposta.dados) {
      setErro(resposta.erro ?? "Não foi possível concluir a ação.");
      return;
    }
    fechar();
    buscarConvites();
  };

  const responder = (sim: boolean) => {
    const { item, acao } = selecionado!;
    const id = item.convite.idConvite;
    if (acao === "responder")
      executar(`/Convites/entrar?idConvite=${id}&aceito=${sim}`);
    else if (sim) executar(`/Convites/${id}/Revogar`);
    else fechar();
  };

  if (recebidos === undefined || enviados === undefined) return <Carregamento />;

  const textos = selecionado && PERGUNTAS[selecionado.acao];

  return (
    <>
      <TituloPagina
        titulo="Meus Convites"
        subtitulo="Compartilhando futuro, construindo juntos!"
      />

      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2.5}
        sx={{ mt: 2, overflow: "hidden" }}
      >
        <TabelaDados
          titulo="Recebidos"
          idPreferencias="convites-recebidos"
          linhas={recebidos}
          colunas={COLUNAS}
          onClicarLinha={({ item }) => abrir(item, "responder")}
        />
        <TabelaDados
          titulo="Enviados"
          idPreferencias="convites-enviados"
          linhas={enviados}
          colunas={COLUNAS}
          onClicarLinha={({ item }) => abrir(item, "revogar")}
        />
      </Stack>

      <Modal
        aberto={Boolean(selecionado)}
        titulo={selecionado?.item.conta.titulo}
        onClose={fechar}
      >
        {textos && (
          <Stack spacing={2} sx={{ alignItems: "center" }}>
            <Typography sx={{ color: "text.secondary" }}>
              {textos.pergunta}
            </Typography>
            {erro && <Alert severity="error">{erro}</Alert>}
            <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
              <Button
                variant="contained"
                startIcon={<Icon>check</Icon>}
                onClick={() => responder(true)}
                sx={{ flex: 1 }}
              >
                {textos.sim}
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<Icon>close</Icon>}
                onClick={() => responder(false)}
                sx={{ flex: 1 }}
              >
                {textos.nao}
              </Button>
            </Stack>
          </Stack>
        )}
      </Modal>
    </>
  );
};

export default Convites;
