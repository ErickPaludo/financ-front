import React, { useContext, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Button, Divider, Link } from "@mui/material";

import { AuthContext } from "../../contexts/AuthContext";
import { autenticar } from "../../services/auth/tokenService";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import LayoutAutenticacao from "../../componentes/layout-autenticacao/LayoutAutenticacao";
import FormularioAutenticacao from "../../componentes/formulario-autenticacao/FormularioAutenticacao";
import CampoTexto from "../../props/campo-texto/CampoTexto";
import { validarEmail } from "../../props/campo-texto/validacoes";

// Sem login com Google no backend ainda; trocar para true quando existir.
const SHOW_GOOGLE_LOGIN = false;

const erroEmail = (email: string) =>
  !email.trim() ? "Informe seu e-mail" : validarEmail(email) && "Informe um e-mail válido";
const erroSenha = (senha: string) => (!senha ? "Informe sua senha" : null);

export const Login: React.FC = () => {
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // Quem já está logado não precisa ver a tela de login.
  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const entrar = async () => {
    if (erroEmail(email) || erroSenha(senha)) return; // erros aparecem nos campos

    const resposta = await autenticar({ email: email.trim(), senha });
    if (!resposta.sucesso || !resposta.dados) {
      return resposta.erro ?? "Não foi possível entrar. Confira seus dados e tente novamente.";
    }

    login({ token: resposta.dados.token, expiration: resposta.dados.expiracao });
    navigate("/");
  };

  const envio = useEnvioFormulario(entrar);

  return (
    <LayoutAutenticacao
      titulo="Acesse sua conta"
      subtitulo="Entre para continuar no PLDProjects"
      linkAlternativo={{ pergunta: "Novo por aqui?", texto: "Crie sua conta", destino: "/registrar" }}
    >
      <FormularioAutenticacao envio={envio} textoBotao="Entrar" textoBotaoEnviando="Entrando…">
        <CampoTexto
          label="E-mail"
          type="email"
          placeholder="voce@exemplo.com"
          autoComplete="email"
          autoFocus
          valor={email}
          setValor={setEmail}
          validar={erroEmail}
          mostrarErro={envio.tentouEnviar}
        />

        <CampoTexto
          label="Senha"
          type="password"
          autoComplete="current-password"
          valor={senha}
          setValor={setSenha}
          validar={erroSenha}
          mostrarErro={envio.tentouEnviar}
          slotProps={{ htmlInput: { maxLength: 16 } }}
        />

        <div className="fnc-login-options">
          <Link component={RouterLink} to="/redefinir-senha" className="fnc-login-link">
            Esqueceu a senha?
          </Link>
        </div>
      </FormularioAutenticacao>

      {SHOW_GOOGLE_LOGIN && (
        <>
          <Divider className="fnc-login-divider">ou</Divider>
          <Button variant="outlined" fullWidth className="fnc-login-google">
            Continuar com Google
          </Button>
        </>
      )}
    </LayoutAutenticacao>
  );
};
