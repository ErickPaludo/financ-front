import React, { useState, useContext } from "react";
import api from "../../services/api/apiConnect";
import { AuthContext } from "../../contexts/AuthContext";
import { ContaContext } from "../../contexts/ContaContext";
import { useNavigate } from "react-router-dom";
import CampoTexto from "../../props/campo-texto/CampoTexto";
import ErrorText from "../../props/error-text/ErrorText";
import { Button } from "@mui/material";
import "./OpcoesUsuarioStyle.css";

const OpcoesUsuario: React.FC = () => {
  const { logout } = useContext(AuthContext);
  const { removeConta } = useContext(ContaContext);
  const navigate = useNavigate();

  const [senhaAntiga, setSenhaAntiga] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [erroSenhaAntiga, setErroSenhaAntiga] = useState<string | null>(null);
  const [erroSenhaNova, setErroSenhaNova] = useState<string | null>(null);
  const [erroConfirmar, setErroConfirmar] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);

  const validar = (): boolean => {
    let valido = true;
    setErroSenhaAntiga(null);
    setErroSenhaNova(null);
    setErroConfirmar(null);
    setErroGeral(null);

    if (!senhaAntiga.trim()) {
      setErroSenhaAntiga("Informe a senha atual.");
      valido = false;
    }

    if (!senhaNova.trim()) {
      setErroSenhaNova("Informe a nova senha.");
      valido = false;
    } else if (senhaNova.length < 6) {
      setErroSenhaNova("A nova senha deve ter pelo menos 6 caracteres.");
      valido = false;
    }

    if (!confirmarSenha.trim()) {
      setErroConfirmar("Confirme a nova senha.");
      valido = false;
    } else if (confirmarSenha !== senhaNova) {
      setErroConfirmar("As senhas não coincidem.");
      valido = false;
    }

    return valido;
  };

  const handleAlterarSenha = async () => {
    if (!validar()) return;

    setLoading(true);
    const resposta = await api<null>("/Usuarios/alterar_senha", "POST", {
      senhaAntiga,
      senhaNova,
    });
    setLoading(false);

    if (!resposta.sucesso) {
      setErroGeral(resposta.erro ?? "Erro ao alterar senha.");
      return;
    }

    setSucesso(true);
    await api<null>("/Autenticacao/revoke", "POST", undefined);
    logout();
    removeConta();
    navigate("/login", { replace: true });
  };

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

      <div className="fnc-opcoes-usuario__card">
        <p className="fnc-opcoes-usuario__section-title">Senha atual</p>

        {/* o CampoTexto de senha já tem o botão de mostrar/ocultar */}
        <CampoTexto
          label="Senha atual"
          valor={senhaAntiga}
          setValor={setSenhaAntiga}
          type="password"
          placeholder="Digite sua senha atual"
        />
        {erroSenhaAntiga && <ErrorText text={erroSenhaAntiga} />}

        <hr className="fnc-opcoes-usuario__divider" />
        <p className="fnc-opcoes-usuario__section-title">Nova senha</p>

        <CampoTexto
          label="Nova senha"
          valor={senhaNova}
          setValor={setSenhaNova}
          type="password"
          placeholder="Digite a nova senha"
        />
        {erroSenhaNova && <ErrorText text={erroSenhaNova} />}

        <CampoTexto
          label="Confirmar nova senha"
          valor={confirmarSenha}
          setValor={setConfirmarSenha}
          type="password"
          placeholder="Confirme a nova senha"
        />
        {erroConfirmar && <ErrorText text={erroConfirmar} />}

        {erroGeral && <ErrorText text={erroGeral} />}

        {sucesso && (
          <div className="fnc-opcoes-usuario__sucesso">
            <span className="material-icons">check_circle</span>
            <span>Senha alterada! Redirecionando...</span>
          </div>
        )}

        <Button
          variant="contained"
          fullWidth
          disabled={loading}
          onClick={handleAlterarSenha}
        >
          {loading ? "Salvando..." : "Alterar Senha"}
        </Button>
      </div>
    </div>
  );
};

export default OpcoesUsuario;
