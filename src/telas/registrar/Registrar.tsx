import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { registrarUsuario } from "../../services/usuario/usuarioService";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import LayoutAutenticacao from "../../componentes/layout-autenticacao/LayoutAutenticacao";
import FormularioAutenticacao from "../../componentes/formulario-autenticacao/FormularioAutenticacao";
import CampoTexto from "../../props/campo-texto/CampoTexto";
import {
  MENSAGEM_CAMPOS_VAZIOS,
  existeCampoVazio,
  validarConfirmacaoSenha,
  validarEmail,
} from "../../props/campo-texto/validacoes";

export const Registrar: React.FC = () => {
  const navigate = useNavigate();

  const [primeiroNome, setPrimeiroNome] = useState("");
  const [segundoNome, setSegundoNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");

  const validarConfirmacao = validarConfirmacaoSenha(senha);

  const criarConta = async () => {
    if (
      existeCampoVazio(
        primeiroNome,
        segundoNome,
        email,
        senha,
        confirmacaoSenha,
      )
    ) {
      return MENSAGEM_CAMPOS_VAZIOS;
    }
    // os erros de email e de confirmação já aparecem nos próprios campos
    if (validarEmail(email) || validarConfirmacao(confirmacaoSenha)) return;

    const resposta = await registrarUsuario({
      primeiroNome,
      segundoNome,
      email: email.trim(),
      senha,
      confirmarSenha: confirmacaoSenha,
    });
    if (!resposta.sucesso) {
      return resposta.erro ?? "Não foi possível criar a conta";
    }

    navigate("/login");
  };

  const envio = useEnvioFormulario(criarConta);

  return (
    <LayoutAutenticacao
      titulo="Vamos começar!"
      subtitulo="O primeiro passo para sua educação financeira!"
      linkAlternativo={{
        pergunta: "Já tem conta?",
        texto: "Fazer login",
        destino: "/login",
      }}
    >
      <FormularioAutenticacao
        envio={envio}
        textoBotao="Criar conta"
        textoBotaoEnviando="Criando conta..."
      >
        <CampoTexto
          label="Primeiro nome"
          placeholder="Primeiro nome"
          autoComplete="given-name"
          valor={primeiroNome}
          setValor={setPrimeiroNome}
        />
        <CampoTexto
          label="Sobrenome"
          placeholder="Sobrenome"
          autoComplete="family-name"
          valor={segundoNome}
          setValor={setSegundoNome}
        />
        <CampoTexto
          label="Email"
          type="email"
          placeholder="minhaconta@email.com"
          autoComplete="email"
          valor={email}
          setValor={setEmail}
          validar={validarEmail}
          mostrarErro={envio.tentouEnviar}
        />
        <CampoTexto
          label="Senha"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          valor={senha}
          setValor={setSenha}
        />
        <CampoTexto
          label="Confirmar senha"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          valor={confirmacaoSenha}
          setValor={setConfirmacaoSenha}
          validar={validarConfirmacao}
          mostrarErro={envio.tentouEnviar}
        />
      </FormularioAutenticacao>
    </LayoutAutenticacao>
  );
};
