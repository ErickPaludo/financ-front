import type { ApiResult } from "../../models/interface/ApiResult";
import type { RegistrarUsuarioRequest } from "../../models/usuario/RegistrarUsuarioRequest";
import api from "../api/apiConnect";

export function registrarUsuario(
  usuario: RegistrarUsuarioRequest,
): Promise<ApiResult<string>> {
  return api<string>("Usuarios/registrar", "POST", usuario);
}
