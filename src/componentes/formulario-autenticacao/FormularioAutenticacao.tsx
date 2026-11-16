import type { ReactNode } from "react";
import { Alert, Button, CircularProgress } from "@mui/material";

import type { EnvioFormulario } from "../../hooks/useEnvioFormulario";

type PropFormularioAutenticacao = {
  envio: EnvioFormulario;
  textoBotao: string;
  textoBotaoEnviando: string;
  children: ReactNode; // campos do formulário
};

// Formulário de login/cadastro: erro geral no topo, campos e botão de envio. Estilos em LayoutAutenticacao.css.
const FormularioAutenticacao: React.FC<PropFormularioAutenticacao> = ({
  envio,
  textoBotao,
  textoBotaoEnviando,
  children,
}) => (
  <form className="fnc-login-form" onSubmit={envio.enviar} noValidate>
    {envio.erro && (
      <Alert severity="error" className="fnc-login-alert">
        {envio.erro}
      </Alert>
    )}

    {children}

    <Button
      type="submit"
      variant="contained"
      fullWidth
      className="fnc-login-submit"
      disabled={envio.enviando}
      startIcon={envio.enviando && <CircularProgress size={18} color="inherit" aria-hidden="true" />}
    >
      {envio.enviando ? textoBotaoEnviando : textoBotao}
    </Button>
  </form>
);

export default FormularioAutenticacao;
