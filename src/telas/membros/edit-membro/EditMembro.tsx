import { useContext, useState } from "react";
import { Alert, Button, Stack } from "@mui/material";

import Conecta from "../../../services/api/apiConnect";
import type { ContaUsuario } from "../../../models/contas-usuarios/GetContaUsuario";
import { ContaContext } from "../../../contexts/ContaContext";
import { useEnvioFormulario } from "../../../hooks/useEnvioFormulario";
import InputSelect from "../../../props/input-select/InputSelect";
import InputCheckBox from "../../../props/input-check-box/InputCheckBox";
import CampoExpiracao from "../../../props/campo-expiracao/CampoExpiracao";
import { OPCOES_PERMISSAO } from "../../../utils/permissao";

const OPCOES_STATUS = [
  { rotulo: "Ativo", valor: "0" },
  { rotulo: "Inativo", valor: "1" },
];

type PropEditMembro = {
  membro: ContaUsuario;
  onClose: () => void;
};

// Gaveta do mestre para mudar permissão, status e expiração de um membro, ou expulsá-lo.
// A gaveta monta o formulário de novo a cada abertura, já com o membro escolhido.
const EditMembro: React.FC<PropEditMembro> = ({ membro, onClose }) => {
  const { conta } = useContext(ContaContext);
  const [acesso, setAcesso] = useState(membro.permissao);
  const [status, setStatus] = useState(membro.status);
  const [removerExpiracao, setRemoverExpiracao] = useState(false);
  const [expira, setExpira] = useState(false);
  const [minutosExpiracao, setMinutosExpiracao] = useState("15");
  const [expulsar, setExpulsar] = useState(false);
  const rotaConta = `/ContasUsuarios/${conta!.idConta}`;

  const salvar = async () => {
    if (expulsar) {
      const resposta = await Conecta<unknown>(`${rotaConta}/expurgo`, "POST", {
        idUsuarioDestinatario: membro.idUsuario,
      });
      if (!resposta.sucesso)
        return resposta.erro ?? "Não foi possível expulsar o usuário.";
      onClose();
      return;
    }

    const resposta = await Conecta<unknown>(`${rotaConta}/alterar`, "PATCH", {
      idUsuarioAlterado: membro.idUsuario,
      acesso,
      status,
      expiracao: expira ? parseInt(minutosExpiracao) : null,
      removerExpiracao: Boolean(membro.expiracao) && removerExpiracao,
    });
    if (!resposta.sucesso)
      return resposta.erro ?? "Não foi possível alterar o usuário.";
    onClose();
  };

  const envio = useEnvioFormulario(salvar);

  return (
    <Stack component="form" onSubmit={envio.enviar} noValidate spacing={2}>
      <InputSelect
        rotulo="Permissão"
        opcoes={OPCOES_PERMISSAO}
        valor={String(acesso)}
        setValor={(valor) => setAcesso(parseInt(valor))}
      />

      <InputCheckBox
        rotulo="Expulsar usuário"
        marcado={expulsar}
        setMarcado={setExpulsar}
      />

      <InputSelect
        rotulo="Status"
        opcoes={OPCOES_STATUS}
        valor={String(status)}
        setValor={(valor) => setStatus(parseInt(valor))}
      />

      {membro.expiracao ? (
        <InputCheckBox
          rotulo="Remover expiração"
          marcado={removerExpiracao}
          setMarcado={setRemoverExpiracao}
        />
      ) : (
        <CampoExpiracao
          ativo={expira}
          setAtivo={setExpira}
          minutos={minutosExpiracao}
          setMinutos={setMinutosExpiracao}
        />
      )}

      {envio.erro && <Alert severity="error">{envio.erro}</Alert>}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={envio.enviando}
      >
        Alterar Usuário
      </Button>
    </Stack>
  );
};

export default EditMembro;
