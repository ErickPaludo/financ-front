import { useMemo, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { IconButton, Link } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";

import { criarTema } from "../../tema";
import { CoresClaro, CoresEscuro } from "../../cores";
import { useModoCor } from "../../hooks/useModoCor";
import logoAzul from "../../assets/pldprojects-logo-azul.svg";
import logoClara from "../../assets/pldprojects-logo-clara.svg";
import "./LayoutAutenticacao.css";

type LinkAlternativo = {
  pergunta: string;
  texto: string;
  destino: string;
};

type PropLayoutAutenticacao = {
  titulo: string;
  subtitulo: string;
  linkAlternativo: LinkAlternativo;
  children: ReactNode; // o formulário da tela
};

// Página das telas de login e cadastro: fundo com marca d'água, cartão com a marca e título, link para a outra tela.
// Tem modo claro/escuro próprio; o resto do app ainda é só escuro.
const LayoutAutenticacao: React.FC<PropLayoutAutenticacao> = ({
  titulo,
  subtitulo,
  linkAlternativo,
  children,
}) => {
  const { modo, alternarModo } = useModoCor();
  const tema = useMemo(() => criarTema(modo), [modo]);
  const escuro = modo === "escuro";
  const proximoModo = escuro ? "claro" : "escuro";
  // Paleta do modo atual vira variáveis --fnc-login-* usadas no LayoutAutenticacao.css.
  const variaveis = Object.fromEntries(
    Object.entries((escuro ? CoresEscuro : CoresClaro).login).map(([chave, cor]) => [`--fnc-login-${chave}`, cor]),
  ) as React.CSSProperties;

  return (
    <ThemeProvider theme={tema}>
      <main className="fnc-login-page fnc-login-bg" style={variaveis}>
        <IconButton
          className="fnc-login-theme"
          onClick={alternarModo}
          aria-label={`Ativar modo ${proximoModo}`}
          title={`Ativar modo ${proximoModo}`}
        >
          {escuro ? <LightModeOutlined /> : <DarkModeOutlined />}
        </IconButton>

        <div className="fnc-login-card">
          <div className="fnc-login-brand">
            <img src={escuro ? logoClara : logoAzul} alt="" className="fnc-login-logo" />
            <span className="fnc-login-brand-name">PLDProjects</span>
          </div>

          <div className="fnc-login-heading">
            <h1>{titulo}</h1>
            <p>{subtitulo}</p>
          </div>

          {children}
        </div>

        <p className="fnc-login-signup">
          {linkAlternativo.pergunta}{" "}
          <Link component={RouterLink} to={linkAlternativo.destino}>
            {linkAlternativo.texto}
          </Link>
        </p>
      </main>
    </ThemeProvider>
  );
};

export default LayoutAutenticacao;
