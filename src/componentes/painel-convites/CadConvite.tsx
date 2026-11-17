import { useState } from "react";
import { Alert, Button, Stack } from "@mui/material";

import Conecta from "../../services/api/apiConnect";
import type { ContaBancaria } from "../../models/contas-usuarios/GetContasBancarias";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import CampoTexto from "../../props/campo-texto/CampoTexto";
import CampoExpiracao from "../../props/campo-expiracao/CampoExpiracao";
import InputSelect from "../../props/input-select/InputSelect";
import SeletorConta from "../../props/seletor-conta/SeletorConta";
import { OPCOES_PERMISSAO, PERMISSAO } from "../../utils/permissao";

type ConviteCadastroRequest = {
  idConta: number;
  emailDestinatario: string;
  acesso: number;
  expiracaoContaUsuario: number | null;
};

type PropCadConvite = {
  contas: ContaBancaria[]; // contas em que o usuário é mestre (só ele convida)
  idContaInicial?: number; // ex.: a conta aberta, quando o convite parte da tela dela
  onClose: () => void;
};

// Convite para outro usuário entrar numa das contas do mestre (gaveta da direita).
const CadConvite: React.FC<PropCadConvite> = ({
  contas,
  idContaInicial,
  onClose,
}) => {
  // com uma conta só, ela já vem escolhida
  const [idConta, setIdConta] = useState<number | null>(
    idContaInicial ?? (contas.length === 1 ? contas[0].idConta : null),
  );
  const [email, setEmail] = useState("");
  const [acesso, setAcesso] = useState<number>(PERMISSAO.Administrador);
  const [expira, setExpira] = useState(false);
  const [minutosExpiracao, setMinutosExpiracao] = useState("15");

  const cadastrar = async () => {
    if (idConta === null) return "Escolha a conta do convite.";
    if (!email) return "O email é obrigatório.";

    const corpo: ConviteCadastroRequest = {
      idConta,
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
      <SeletorConta contas={contas} valor={idConta} setValor={setIdConta} />
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
