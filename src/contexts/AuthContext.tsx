import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  configurarSessao,
  refreshToken,
  setAccessToken,
} from "../services/api/api";
import { useNavigate } from "react-router-dom";

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
  authenticated: boolean;
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
    const salvo = localStorage.getItem("user");
    return salvo ? JSON.parse(salvo) : null;
  });
  // sem usuário salvo não há sessão para restaurar
  const [inicializando, setInicializando] = useState(user !== null);

  const authenticated =
    tokenData !== null && Date.now() < new Date(tokenData.expiration).getTime();

  function logout() {
    setAccessToken(null);
    setTokenData(null);
    setUserObj(null);
    localStorage.clear();

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
  }, []);

  function login(novoTokenData: TokenData) {
    setAccessToken(novoTokenData.token);

    setTokenData(novoTokenData);
  }

  function setUser(u: User) {
    setUserObj(u);

    localStorage.setItem("user", JSON.stringify(u));
  }

  return (
    <AuthContext.Provider
      value={{
        tokenData,
        user,
        authenticated,
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

export function useAuth() {
  return useContext(AuthContext);
}
