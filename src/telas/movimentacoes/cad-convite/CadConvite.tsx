import { useContext, useState } from "react";
import { Alert, Button, Stack } from "@mui/material";

import Conecta from "../../../services/api/apiConnect";
import { ContaContext } from "../../../contexts/ContaContext";
import { useEnvioFormulario } from "../../../hooks/useEnvioFormulario";
import CampoTexto from "../../../props/campo-texto/CampoTexto";
import CampoExpiracao from "../../../props/campo-expiracao/CampoExpiracao";
import InputSelect from "../../../props/input-select/InputSelect";
import { OPCOES_PERMISSAO, PERMISSAO } from "../../../utils/permissao";

type ConviteCadastroRequest = {
  idConta: number;
  emailDestinatario: string;
  acesso: number;
  expiracaoContaUsuario: number | null;
};

type PropCadConvite = {
  onClose: () => void;
};

// Convite para outro usuário entrar na conta selecionada (gaveta da tela da conta).
const CadConvite: React.FC<PropCadConvite> = ({ onClose }) => {
  const { conta } = useContext(ContaContext);
  const [email, setEmail] = useState("");
  const [acesso, setAcesso] = useState<number>(PERMISSAO.Administrador);
  const [expira, setExpira] = useState(false);
  const [minutosExpiracao, setMinutosExpiracao] = useState("15");

  const cadastrar = async () => {
    if (!email) return "O email é obrigatório.";

    const corpo: ConviteCadastroRequest = {
      idConta: conta!.idConta,
      emailDestinatario: email,
      acesso,
      expiracaoContaUsuario: expira ? parseInt(minutosExpiracao) : null,
    };
    const resposta = await Conecta<unknown>("/Convites", "POST", corpo);
    if (!resposta.sucesso)
      return resposta.erro ?? "Não foi possível enviar o convite.";
    onClose();
  };

  const envio = useEnvioFormulario(cadastrar);

  return (
    <Stack component="form" onSubmit={envio.enviar} noValidate spacing={2}>
      <CampoTexto
        label="Email do usuário"
        valor={email}
        placeholder="convidado@email.com"
        setValor={setEmail}
        type="email"
        slotProps={{ htmlInput: { maxLength: 100 } }}
      />

      <InputSelect
        rotulo="Permissão"
        opcoes={OPCOES_PERMISSAO}
        valor={String(acesso)}
        setValor={(valor) => setAcesso(parseInt(valor))}
      />

      <CampoExpiracao
        ativo={expira}
        setAtivo={setExpira}
        minutos={minutosExpiracao}
        setMinutos={setMinutosExpiracao}
      />

      {envio.erro && <Alert severity="error">{envio.erro}</Alert>}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={envio.enviando}
      >
        {envio.enviando ? "Cadastrando..." : "Cadastrar"}
      </Button>
    </Stack>
  );
};

export default CadConvite;
