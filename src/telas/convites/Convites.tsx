import React, { useContext, useEffect, useState } from "react";
import TitleText from "../../props/title-text/TitleText";
import "./ConvitesStyle.css";
import LabelText from "../../props/label-text/LabelText";
import TabelaDados, {
  type ColunaTabela,
} from "../../componentes/tabela-dados/TabelaDados";
import type {
  ConviteItem,
  ConviteResponse,
} from "../../models/convite/ConviteResponse";
import api from "../../services/api/apiConnect";
import Carregamento from "../../componentes/carregamento/Carregamento";
import Modal from "../../componentes/modal/Modal";
import { ConviteContext } from "../../contexts/ConviteContext";
import SubtitleText from "../../props/subtitle-text/SubtitleText";
import { Button, Icon } from "@mui/material";
import ErrorText from "../../props/error-text/ErrorText";
const Convites = () => {
  interface IConvite {
    id: number;
    conta: string;
    usuario: string;
    acesso: string;
    status: string;
    dtEnvio: string;
    dtExpiracao: string;
    convite: ConviteItem;
  }
  const { setConvite, convite, removeConvite } = useContext(ConviteContext);
  const colunas: ColunaTabela<IConvite>[] = [
    { titulo: "Conta", chave: "conta" },
    { titulo: "Usuário", chave: "usuario" },
    { titulo: "Acesso", chave: "acesso" },
    { titulo: "Status", chave: "status" },
    { titulo: "Data Envio", chave: "dtEnvio" },
    { titulo: "Data Expiração", chave: "dtExpiracao" },
  ];

  const typePermission = (value: number) => {
    switch (value) {
      case 0:
        return "Mestre";

      case 1:
        return "Administrador";

      default:
        return "Visualizador";
    }
  };

  const [convitesRecebidos, setConvitesRecebidos] =
    React.useState<IConvite[]>();

  const [convitesEnviados, setConvitesEnviados] = React.useState<IConvite[]>();
  const [modalInvite, setIsModalInvite] = useState(false);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  const [modalRevokeInvite, setIsModalRevokeInvite] = useState(false);

  const handleConviteClick = async (objetoDaLinha: IConvite) => {
    setConvite(objetoDaLinha.convite);
    if (convite?.convite !== null) {
      setIsModalInvite(true);
      setConvitesRecebidos(undefined);
      setConvitesEnviados(undefined);
      await buscaConvites();
    }
  };

  const handleRevokeConviteClick = async (objetoDaLinha: IConvite) => {
    setConvite(objetoDaLinha.convite);
    if (convite?.convite !== null) {
      setIsModalRevokeInvite(true);
      setConvitesRecebidos(undefined);
      setConvitesEnviados(undefined);
      await buscaConvites();
    }
  };

  const buscaConvites = async () => {
    try {
      const respConvitesRecebidos = await api<ConviteResponse>(
        `/Convites`,
        "GET",
        undefined,
      );

      const respConvitesEnviados = await api<ConviteResponse>(
        `/Convites?remetente=true`,
        "GET",
        undefined,
      );

      function dateConvert(value: string) {
        return new Date(value).toLocaleDateString("pt-BR");
      }

      const meusConvites: IConvite[] = [];

      if (respConvitesRecebidos.sucesso && respConvitesRecebidos.dados) {
        respConvitesRecebidos.dados.conteudo.map((invite) => {
          meusConvites.push({
            id: invite.convite.idConvite,
            conta: invite.conta.titulo,
            usuario: invite.usuarioRemetente.email,
            acesso: typePermission(invite.convite.acesso),
            status:
              invite.convite.aceito === null
                ? "Pendente"
                : invite.convite.aceito
                  ? "Aceito"
                  : "Recusado",

            dtEnvio: dateConvert(invite.convite.dataEnvio),
            dtExpiracao: dateConvert(invite.convite.dataExpiracao),
            convite: invite,
          });
        });
        // fora do map: sem convites a lista vazia também é gravada (senão a tabela ficava carregando)
        setConvitesRecebidos(meusConvites);
      } else {
        setConvitesRecebidos([]);
      }

      const meusConvitesEnviados: IConvite[] = [];

      if (respConvitesEnviados.sucesso && respConvitesEnviados.dados) {
        respConvitesEnviados.dados.conteudo.map((invite) => {
          meusConvitesEnviados.push({
            id: invite.convite.idConvite,
            conta: invite.conta.titulo,
            usuario: invite.usuarioDestinatario.email,
            acesso: typePermission(invite.convite.acesso),
            status:
              invite.convite.aceito === null
                ? "Pendente"
                : invite.convite.aceito
                  ? "Aceito"
                  : "Recusado",

            dtEnvio: dateConvert(invite.convite.dataEnvio),
            dtExpiracao: dateConvert(invite.convite.dataExpiracao),
            convite: invite,
          });
        });
        setConvitesEnviados(meusConvitesEnviados);
      } else {
        setConvitesEnviados([]);
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      setConvitesRecebidos([]);
      setConvitesEnviados([]);
    }
  };

  useEffect(() => {
    const carregar = async () => {
      await buscaConvites();
    };

    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- busca só ao abrir a tela
  }, []);

  const entrarNaConta = async (value: boolean) => {
    try {
      const retorno = await api<ConviteResponse>(
        `/Convites/entrar?idConvite=${convite?.convite.idConvite}&aceito=${value}`,
        "POST",
        undefined,
      );

      if (retorno.sucesso && retorno.dados) {
        removeConvite();
        setIsModalInvite(false);
        buscaConvites();
      } else {
        setErroMsg(retorno!.erro!);
      }
    } catch (error) {
      console.error("Erro ao buscar convites:", error);
    }
  };

  const revogarConvite = async () => {
    try {
      const retorno = await api<string>(
        `/Convites/${convite?.convite.idConvite}/Revogar`,
        "POST",
        undefined,
      );

      if (retorno.sucesso && retorno.dados) {
        removeConvite();
        setIsModalRevokeInvite(false);
        buscaConvites();
      } else {
        setErroMsg(retorno!.erro!);
      }
    } catch (error) {
      console.error("Erro ao buscar convites:", error);
    }
  };

  return (
    <>
      {convitesRecebidos !== undefined && convitesEnviados !== undefined ? (
        <>
          <div className="fnc-invite-title">
            <TitleText text="Meus Convites" />
            <LabelText text="Compartilhando futuro, construindo juntos!" />
          </div>

          <div className="fnc-tables-invite">
            <TabelaDados
              titulo="Recebidos"
              idPreferencias="convites-recebidos"
              linhas={convitesRecebidos ?? []}
              carregando={convitesRecebidos === undefined}
              colunas={colunas}
              onClicarLinha={handleConviteClick}
            />

            <TabelaDados
              titulo="Enviados"
              idPreferencias="convites-enviados"
              linhas={convitesEnviados ?? []}
              carregando={convitesEnviados === undefined}
              colunas={colunas}
              onClicarLinha={handleRevokeConviteClick}
            />
          </div>

          {modalInvite && (
            <Modal
              isOpen={modalInvite}
              onClose={() => {
                setIsModalInvite(false);
                setErroMsg(null);
              }}
            >
              <>
                <div className="fnc-ctn-aceept-invite">
                  <TitleText text={convite!.conta!.titulo} />
                  <SubtitleText text="Deseja entrar na conta?" />
                  {erroMsg && <ErrorText text={erroMsg} />}
                  <div className="fnc-ctn-btn-invite-acept">
                    <Button
                      variant="contained"
                      startIcon={<Icon>check</Icon>}
                      onClick={async () => await entrarNaConta(true)}
                      sx={{ flex: 1 }}
                    >
                      Aceitar
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<Icon>close</Icon>}
                      onClick={async () => await entrarNaConta(false)}
                      sx={{ flex: 1 }}
                    >
                      Recusar
                    </Button>
                  </div>
                </div>
              </>
            </Modal>
          )}

          {modalRevokeInvite && (
            <Modal
              isOpen={modalRevokeInvite}
              onClose={() => {
                setIsModalRevokeInvite(false);
                setErroMsg(null);
              }}
            >
              <>
                <div className="fnc-ctn-aceept-invite">
                  <TitleText text={convite!.conta!.titulo} />
                  <SubtitleText text="Deseja revogar o convite?" />
                  {erroMsg && <ErrorText text={erroMsg} />}
                  <div className="fnc-ctn-btn-invite-acept">
                    <Button
                      variant="contained"
                      startIcon={<Icon>check</Icon>}
                      onClick={async () => await revogarConvite()}
                      sx={{ flex: 1 }}
                    >
                      Sim
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<Icon>close</Icon>}
                      onClick={() => setIsModalRevokeInvite(false)}
                      sx={{ flex: 1 }}
                    >
                      Não
                    </Button>
                  </div>
                </div>
              </>
            </Modal>
          )}
        </>
      ) : (
        <Carregamento />
      )}
    </>
  );
};

export default Convites;
