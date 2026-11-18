import { useContext } from "react";

import { AuthContext } from "../contexts/AuthContext";
import { ContaContext } from "../contexts/ContaContext";
import { revogarSessao } from "../services/auth/tokenService";

// Revoga a sessão no servidor e limpa usuário e conta (o logout já navega para /login).
export function useEncerrarSessao() {
  const { logout } = useContext(AuthContext);
  const { limparConta } = useContext(ContaContext);
  return async () => {
    await revogarSessao();
    logout();
    limparConta();
  };
}
