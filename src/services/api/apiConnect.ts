import type { ApiResult } from "../../models/interface/ApiResult";
import { isAxiosError } from "axios";
import api from "./api";

type Metodo = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

// Executa a requisição e formata o resultado.
// Bearer token e refresh (401) são tratados pelos interceptors em api.ts.
export default async function Conecta<T>(
  rota: string,
  metodo: Metodo,
  objeto?: object,
): Promise<ApiResult<T>> {
  try {
    const resposta = await api.request<T>({ url: rota, method: metodo, data: objeto });
    return { sucesso: true, dados: resposta.data };
  } catch (erro) {
    const resposta = isAxiosError(erro) ? erro.response : undefined;
    const msgErro =
      typeof resposta?.data === "string"
        ? resposta.data
        : (resposta?.data?.mensagem ??
          // sem resposta do servidor (offline, certificado, CORS): garante que `erro` nunca venha vazio
          (erro instanceof Error ? erro.message : undefined) ??
          "Falha na comunicação com o servidor");

    return { sucesso: false, erro: msgErro, status: resposta?.status };
  }
}
