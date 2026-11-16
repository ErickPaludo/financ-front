import { useState } from "react";
import {
  IconButton,
  InputAdornment,
  TextField,
  type TextFieldProps,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

type PropCampoTexto = Omit<TextFieldProps, "value" | "onChange" | "error"> & {
  valor: string;
  setValor: (valor: string) => void;
  // devolve a mensagem de erro, ou null quando o valor é válido
  validar?: (valor: string) => string | null;
  // o erro só aparece quando true (ex.: depois de tentar enviar o formulário)
  mostrarErro?: boolean;
};

// TextField padrão do app. O erro só aparece quando a tela pede (mostrarErro).
// Com type="password", ganha um botão para mostrar/ocultar a senha.
const CampoTexto: React.FC<PropCampoTexto> = ({
  valor,
  setValor,
  validar,
  mostrarErro = false,
  helperText,
  type,
  slotProps,
  ...props
}) => {
  const [verSenha, setVerSenha] = useState(false);
  const erro = validar && mostrarErro ? validar(valor) : null;
  const ehSenha = type === "password";

  return (
    <TextField
      fullWidth
      {...props}
      type={ehSenha && verSenha ? "text" : type}
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      error={erro !== null}
      helperText={erro ?? helperText}
      slotProps={
        ehSenha
          ? {
              ...slotProps,
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      sx={{ opacity: 0.6 }}
                      aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setVerSenha(!verSenha)}
                      // evita tirar o foco do campo ao clicar no ícone
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {verSenha ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }
          : slotProps
      }
    />
  );
};

export default CampoTexto;
