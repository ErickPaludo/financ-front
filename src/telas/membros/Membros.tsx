import api from "../../services/api/apiConnect";
import React, { useContext, useEffect, useState } from "react";

import TabelaDados, {
  type ColunaTabela,
} from "../../componentes/tabela-dados/TabelaDados";
import "./MembrosStyle.css";
import TitleText from "../../props/title-text/TitleText";
import LabelText from "../../props/label-text/LabelText";
import { ContaContext } from "../../contexts/ContaContext";
import { AuthContext } from "../../contexts/AuthContext";
import MsgTextBox from "../../props/text-box/MsgTextBox";
import { Button } from "@mui/material";
import type {
  ContaUsuario,
  GetContaUsuario,
} from "../../models/contas-usuarios/GetContaUsuario";
import Modal from "../../componentes/modal/Modal";
import EditMembro from "./edit-membro/EditMembro";

const Membros = () => {
  interface IMembros {
    id: string;
    email: string;
    acesso: string;
    status: string;
    dtExpiracao: string;
    usuario: ContaUsuario;
  }
  const { conta, usuario, setMembroConta } = useContext(ContaContext);
  const { user } = useContext(AuthContext);

  const colunas: ColunaTabela<IMembros>[] = [
    { titulo: "Email", chave: "email" },
    { titulo: "Acesso", chave: "acesso" },
    { titulo: "Status", chave: "status" },
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

  function dateConvert(value: string) {
    return new Date(value).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  // undefined = ainda buscando (a tabela mostra o carregamento)
  const [membros, setMembros] = React.useState<IMembros[]>();
  const [openEditUser, setOpenEditUser] = useState<boolean>(false);

  const buscaContaUsuario = async () => {
    try {
      const membroConta: IMembros[] = [];

      const resposta = await api<GetContaUsuario>(
        `/ContasUsuarios/${conta!.idConta}/associados`,
        "GET",
        undefined,
      );
      if (resposta.sucesso && resposta.dados) {
        resposta.dados.conteudo
          .filter((members) => members.idUsuario !== user?.id)
          .map((members) => {
            console.log(members);
            membroConta.push({
              id: members.idUsuario,
              email: members.email,
              acesso: typePermission(members.permissao),
              status: members.status === 0 ? "Ativo" : "Inativo",
              dtExpiracao: members.expiracao
                ? dateConvert(members.expiracao)
                : "",
              usuario: members,
            });
          });
        setMembros(membroConta);
      } else setMembros([]);
    } catch (error) {
      console.error("Erro ao buscar conta usuário:", error);
      setMembros([]);
    }
  };

  useEffect(() => {
    const carregar = async () => {
      await buscaContaUsuario();
    };

    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- busca só ao abrir a tela
  }, []);

  const handleMemberClick = async (objetoDaLinha: IMembros) => {
    setMembroConta(objetoDaLinha.usuario);
    console.log(usuario);
    if (usuario?.permissao === 0) setOpenEditUser(true);
  };

  return (
    <>
      <Modal
        isOpen={openEditUser}
        onClose={() => {
          setOpenEditUser(false);
        }}
      >
        <EditMembro
          setOpen={async () => {
            setOpenEditUser(false);
            await buscaContaUsuario();
          }}
        />
      </Modal>

      <div className="fnc-members-title">
        <TitleText text={`Membros da ${conta?.titulo}`} />
        <LabelText
          text={`${user?.primeiroNome}, você é o ${typePermission(usuario!.permissao)} dessa conta!`}
        />
      </div>

      <div className="fnc-ctn-members">
        <div className="fnc-warning">
          {usuario?.expiracao && (
            <MsgTextBox
              title="! IMPORTANTE !"
              description={`Sua conta vai expirar: ${dateConvert(usuario?.expiracao ?? "")}`}
              colorTitle="#c90d0d"
            />
          )}
        </div>

        <TabelaDados
          titulo="Membros"
          idPreferencias="membros"
          linhas={membros ?? []}
          carregando={membros === undefined}
          colunas={colunas}
          onClicarLinha={handleMemberClick}
        />
        <div className="fnc-members-update">
          <div>
            <Button variant="contained" onClick={buscaContaUsuario}>
              Atualizar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Membros;
