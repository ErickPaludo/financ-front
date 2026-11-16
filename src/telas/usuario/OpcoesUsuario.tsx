import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button } from "@mui/material";

import Conecta from "../../services/api/apiConnect";
import { AuthContext } from "../../contexts/AuthContext";
import { ContaContext } from "../../contexts/ContaContext";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import CampoTexto from "../../props/campo-texto/CampoTexto";
import { validarConfirmacaoSenha } from "../../props/campo-texto/validacoes";
import "./OpcoesUsuarioStyle.css";

const validarSenhaAtual = (senha: string) =>
  senha.trim() ? null : "Informe a senha atual.";

const validarSenhaNova = (senha: string) =>
  !senha.trim()
    ? "Informe a nova senha."
    : senha.length < 6
      ? "A nova senha deve ter pelo menos 6 caracteres."
      : null;

// Alteração de senha; depois de alterar, desloga.
const OpcoesUsuario: React.FC = () => {
  const { logout } = useContext(AuthContext);
  const { limparConta } = useContext(ContaContext);
  const navigate = useNavigate();

  const [senhaAntiga, setSenhaAntiga] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const validarConfirmacao = (confirmacao: string) =>
    confirmacao.trim()
      ? validarConfirmacaoSenha(senhaNova)(confirmacao)
      : "Confirme a nova senha.";

  const alterarSenha = async () => {
    // os erros aparecem nos próprios campos
    if (
      validarSenhaAtual(senhaAntiga) ||
      validarSenhaNova(senhaNova) ||
      validarConfirmacao(confirmarSenha)
    )
      return;

    const resposta = await Conecta<null>("/Usuarios/alterar_senha", "POST", {
      senhaAntiga,
      senhaNova,
    });
    if (!resposta.sucesso) return resposta.erro ?? "Erro ao alterar senha.";

    setSucesso(true);
    await Conecta<null>("/Autenticacao/revoke", "POST");
    logout();
    limparConta();
    navigate("/login", { replace: true });
  };

  const envio = useEnvioFormulario(alterarSenha);

  return (
    <div className="fnc-opcoes-usuario">
      <div className="fnc-opcoes-usuario__header">
        <div className="fnc-opcoes-usuario__icon">
          <span className="material-icons">lock</span>
        </div>
        <p className="fnc-opcoes-usuario__title">Alterar Senha</p>
        <p className="fnc-opcoes-usuario__subtitle">
          Após a alteração você será deslogado automaticamente.
        </p>
      </div>

      <form
        className="fnc-opcoes-usuario__card"
        onSubmit={envio.enviar}
        noValidate
      >
        <p className="fnc-opcoes-usuario__section-title">Senha atual</p>

        {/* o CampoTexto de senha já tem o botão de mostrar/ocultar */}
        <CampoTexto
          label="Senha atual"
          valor={senhaAntiga}
          setValor={setSenhaAntiga}
          type="password"
          placeholder="Digite sua senha atual"
          validar={validarSenhaAtual}
          mostrarErro={envio.tentouEnviar}
        />

        <hr className="fnc-opcoes-usuario__divider" />
        <p className="fnc-opcoes-usuario__section-title">Nova senha</p>

        <CampoTexto
          label="Nova senha"
          valor={senhaNova}
          setValor={setSenhaNova}
          type="password"
          placeholder="Digite a nova senha"
          validar={validarSenhaNova}
          mostrarErro={envio.tentouEnviar}
        />

        <CampoTexto
          label="Confirmar nova senha"
          valor={confirmarSenha}
          setValor={setConfirmarSenha}
          type="password"
          placeholder="Confirme a nova senha"
          validar={validarConfirmacao}
          mostrarErro={envio.tentouEnviar}
        />

        {envio.erro && <Alert severity="error">{envio.erro}</Alert>}
        {sucesso && (
          <Alert severity="success">Senha alterada! Redirecionando...</Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={envio.enviando}
        >
          {envio.enviando ? "Salvando..." : "Alterar Senha"}
        </Button>
      </form>
    </div>
  );
};

export default OpcoesUsuario;
