import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { TokenResponse } from "../../models/autenticacao/TokenResponse";

// .env.development (/api, proxy do Vite) ou .env.production; modelo em .env.example.
const baseURL = import.meta.env.VITE_API_URL;
if (!baseURL)
  throw new Error("VITE_API_URL não definida: crie o .env a partir do .env.example");

const api = axios.create({ baseURL, withCredentials: true });

// Instância sem interceptors: o refresh nunca dispara outro refresh.
const authApi = axios.create({ baseURL, withCredentials: true });

let accessToken: string | null = null;
let refreshEmAndamento: Promise<TokenResponse | null> | null = null;

type Sessao = {
  onRefresh: (dados: TokenResponse) => void;
  onExpirada: () => void;
};
let sessao: Sessao = { onRefresh: () => {}, onExpirada: () => {} };

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function configurarSessao(callbacks: Sessao) {
  sessao = callbacks;
}

// Usa o cookie httpOnly. Chamadas simultâneas compartilham a mesma requisição.
export function refreshToken(): Promise<TokenResponse | null> {
  refreshEmAndamento ??= authApi
    .post<TokenResponse>("/Autenticacao/refresh")
    .then(({ data }) => {
      accessToken = data.token;
      sessao.onRefresh(data);
      return data;
    })
    .catch(() => null)
    .finally(() => {
      refreshEmAndamento = null;
    });
  return refreshEmAndamento;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (erro: AxiosError) => {
    const original = erro.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      erro.response?.status !== 401 ||
      !original ||
      original._retry ||
      original.url?.includes("Autenticacao/login")
    ) {
      return Promise.reject(erro);
    }

    original._retry = true;
    const novo = await refreshToken();
    if (novo) return api(original);

    // refresh também deu 401: sessão encerrada, volta para a tela inicial
    accessToken = null;
    sessao.onExpirada();
    return Promise.reject(erro);
  },
);

export default api;
