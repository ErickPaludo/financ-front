import { useContext, useState } from "react";
import { ContaContext } from "../../../contexts/ContaContext";
import TitleText from "../../../props/title-text/TitleText";
import InputSelect from "../../../props/input-select/InputSelect";
import InputCheckBox from "../../../props/input-check-box/InputCheckBox";
import { Button } from "@mui/material";
import CampoTexto from "../../../props/campo-texto/CampoTexto";
import api from "../../../services/api/apiConnect";
import ErrorText from "../../../props/error-text/ErrorText";
import "./EditMembro.css";
type PropEditMembro = {
  setOpen: (value: boolean) => void;
};

const EditMembro: React.FC<PropEditMembro> = ({ setOpen }) => {
  const { conta, membro } = useContext(ContaContext);

  // a gaveta monta o formulário de novo a cada abertura, já com o membro escolhido
  const [acesso, setAcesso] = useState<number>(membro?.permissao ?? 0);
  const [status, setStatus] = useState<number>(membro?.status ?? 0);

  const [expirarAcesso, setExpirarAcesso] = useState<boolean>(false);

  const [checkExpiracao, setCheckExpiracao] = useState<boolean>(false);
  const [tempoExpiracao, setTempoExpiracao] = useState<string>("15");

  const [expulsar, setExpulsar] = useState<boolean>(false);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  const alteraUsuario = async () => {
    try {
      if (expulsar) {
        const resposta = await api<{
          idConta: number;
          acesso: number;
          idUsuario: string;
        }>(`/ContasUsuarios/${conta?.idConta}/expurgo`, "POST", {
          idUsuarioDestinatario: membro!.idUsuario,
        });
        if (resposta.sucesso && resposta.dados) {
          setOpen(false);
          return;
        }
      }

      const request = {
        idUsuarioAlterado: membro!.idUsuario,
        acesso: acesso,
        status: status,
        expiracao: checkExpiracao === true ? parseInt(tempoExpiracao) : null,
        removerExpiracao: membro?.expiracao
          ? expirarAcesso
            ? true
            : false
          : false,
      };

      console.log(request);

      const resposta = await api<{
        idConta: number;
        acesso: number;
        idUsuario: string;
      }>(`/ContasUsuarios/${conta?.idConta}/alterar`, "PATCH", request);

      if (resposta.sucesso && resposta.dados) {
        setOpen(false);
      } else {
        setErroMsg(resposta!.erro!);
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  return (
    <>
      <div className="fnc-edit-user">
        <TitleText text="Alterar Usuario"></TitleText>

        <InputSelect
          label="Permissão"
          opcoes={[
            { label: "Administrador", value: "1" },
            { label: "Visualizador", value: "2" },
            { label: "Mestre", value: "0" },
          ]}
          value={String(acesso)} // ← aqui
          onChange={(valor) => setAcesso(parseInt(valor))}
        />

        <InputCheckBox
          label="Expulsar usuário"
          checked={expulsar}
          setChecked={setExpulsar}
        />

        <InputSelect
          label="Status"
          opcoes={[
            { label: "Ativo", value: "0" },
            { label: "Inativo", value: "1" },
          ]}
          onChange={(valor) => setStatus(parseInt(valor))}
          value={String(status)}
        />

        {membro?.expiracao && (
          <InputCheckBox
            checked={expirarAcesso}
            label="Remover expiração"
            setChecked={setExpirarAcesso}
          />
        )}
        {!membro?.expiracao && (
          <>
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
          </>
        )}
        {erroMsg && <ErrorText text={erroMsg} />}
        <Button variant="contained" fullWidth onClick={alteraUsuario}>
          Alterar Usuário
        </Button>
      </div>
    </>
  );
};

export default EditMembro;
