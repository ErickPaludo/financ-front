import { createContext, useEffect, useState, type ReactNode } from "react";
import {
  configurarSessao,
  refreshToken,
  setAccessToken,
} from "../services/api/api";
import { useNavigate } from "react-router-dom";
import { guardarPreferencias } from "../utils/preferencias";

export interface TokenData {
  token: string;
  expiration: string;
}

export type User = {
  id: string;
  primeiroNome: string;
  segundoNome: string;
  nomeCompleto: string;
  email: string;
};

type AuthContextType = {
  tokenData: TokenData | null;
  user: User | null;
  inicializando: boolean;
  login: (tokenData: TokenData) => void;
  setUser: (user: User) => void;
  logout: () => void;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContext = createContext({} as AuthContextType);

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [user, setUserObj] = useState<User | null>(() => {
    // valor corrompido ou storage bloqueado (aba anônima) não pode derrubar o app: segue sem sessão
    try {
      const salvo = localStorage.getItem("user");
      return salvo ? JSON.parse(salvo) : null;
    } catch {
      return null;
    }
  });
  // sem usuário salvo não há sessão para restaurar
  const [inicializando, setInicializando] = useState(user !== null);

  function logout() {
    setAccessToken(null);
    setTokenData(null);
    setUserObj(null);
    // limpa o localStorage, mas guarda as preferências pelo e-mail para o próximo login
    guardarPreferencias(user?.email);

    navigate("/login", { replace: true });
  }

  // Registrado no render (não em useEffect) para valer já nas primeiras requisições dos filhos.
  configurarSessao({
    onRefresh: (dados) =>
      setTokenData({ token: dados.token, expiration: dados.expiracao }),
    onExpirada: logout,
  });

  useEffect(() => {
    if (!inicializando) return;
    refreshToken()
      .then((dados) => {
        if (!dados) logout();
      })
      .finally(() => setInicializando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roda uma vez, ao abrir o app
  }, []);

  function login(novoTokenData: TokenData) {
    setAccessToken(novoTokenData.token);

    setTokenData(novoTokenData);
  }

  function setUser(u: User) {
    setUserObj(u);

    try {
      localStorage.setItem("user", JSON.stringify(u));
    } catch {
      // sem storage o usuário vale só nesta aba
    }
  }

  return (
    <AuthContext.Provider
      value={{
        tokenData,
        user,
        inicializando,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
