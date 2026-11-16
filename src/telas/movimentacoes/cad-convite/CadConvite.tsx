import React, { useContext, useState } from "react";
import TitleText from "../../../props/title-text/TitleText";
import CampoTexto from "../../../props/campo-texto/CampoTexto";
import InputSelect from "../../../props/input-select/InputSelect";
import { Button } from "@mui/material";
import InputCheckBox from "../../../props/input-check-box/InputCheckBox";
import api from "../../../services/api/apiConnect";
import { ContaContext } from "../../../contexts/ContaContext";
import ErrorText from "../../../props/error-text/ErrorText";

type ConviteCadastroResponse = {
  valor: ConviteCadastroValor;
};

type ConviteCadastroValor = {
  idConvite: number;
  permissao: number;
};

type ConviteCadastroRequest = {
  idConta: number;
  emailDestinatario: string;
  acesso: number;
  expiracaoContaUsuario?: number | null;
};

type PropCadConvite = {
  setIsCadInvite: (value: boolean) => void;
};

const CadConvite: React.FC<PropCadConvite> = ({ setIsCadInvite }) => {
  const { conta } = useContext(ContaContext);
  const [email, setEmail] = useState("");
  const [acesso, setAcesso] = useState<number>(1);
  const [checkExpiracao, setCheckExpiracao] = useState(false);
  const [tempoExpiracao, setTempoExpiracao] = useState<string>("15");
  const [msgError, setMsgError] = useState<string | null>(null);

  const cadastrarConvite = async () => {
    try {
      if (!email) {
        setMsgError("O email é obrigatório.");
        return;
      }
      const request: ConviteCadastroRequest = {
        acesso: acesso,
        emailDestinatario: email,
        idConta: conta!.idConta,
        expiracaoContaUsuario:
          checkExpiracao === true ? parseInt(tempoExpiracao) : null,
      };

      const resposta = await api<ConviteCadastroResponse>(
        `/Convites`,
        "POST",
        request,
      );
      if (resposta.sucesso && resposta.dados) {
        setIsCadInvite(false);
      } else {
        setMsgError(resposta!.erro!);
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  return (
    <>
      <TitleText text="Cadastro de Convite" />
      <CampoTexto
        label="Email do usuário"
        valor={email}
        placeholder="convidado@email.com"
        setValor={setEmail}
        type="email"
        slotProps={{ htmlInput: { maxLength: 100 } }}
      />

      <InputSelect
        label="Permissão"
        opcoes={[
          { label: "Administrador", value: "1" },
          { label: "Visualizador", value: "2" },
          { label: "Mestre", value: "0" },
        ]}
        onChange={(valor) => setAcesso(parseInt(valor))}
        value={String(acesso)}
      />

      <InputCheckBox
        label="Tempo de expiração"
        checked={checkExpiracao}
        setChecked={setCheckExpiracao}
      />

      {checkExpiracao && (
        <CampoTexto
          label="Tempo de expiração em minutos"
          valor={tempoExpiracao}
          setValor={setTempoExpiracao}
          type="number"
        />
      )}
      {msgError && <ErrorText text={msgError} />}

      <Button variant="contained" fullWidth onClick={cadastrarConvite}>
        Cadastrar
      </Button>
    </>
  );
};

export default CadConvite;
