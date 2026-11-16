import type { CredenciaisLogin } from "../../models/autenticacao/TokenRequest";
import type { TokenResponse } from "../../models/autenticacao/TokenResponse";
import type { ApiResult } from "../../models/interface/ApiResult";
import api from "../api/apiConnect";

export function autenticar(
  credenciais: CredenciaisLogin,
): Promise<ApiResult<TokenResponse>> {
  return api<TokenResponse>("Autenticacao/login", "POST", credenciais);
}
