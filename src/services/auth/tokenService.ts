import type { CredenciaisLogin } from "../../models/autenticacao/TokenRequest";
import type { TokenResponse } from "../../models/autenticacao/TokenResponse";
import type { ApiResult } from "../../models/interface/ApiResult";
import Conecta from "../api/apiConnect";

export function autenticar(
  credenciais: CredenciaisLogin,
): Promise<ApiResult<TokenResponse>> {
  return Conecta<TokenResponse>("Autenticacao/login", "POST", credenciais);
}

// Encerra a sessão no servidor (invalida o refresh token).
export const revogarSessao = () => Conecta<null>("/Autenticacao/revoke", "POST");
