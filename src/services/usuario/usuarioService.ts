import type { ApiResult } from "../../models/interface/ApiResult";
import type { RegistrarUsuarioRequest } from "../../models/usuario/RegistrarUsuarioRequest";
import Conecta from "../api/apiConnect";

export function registrarUsuario(
  usuario: RegistrarUsuarioRequest,
): Promise<ApiResult<string>> {
  return Conecta<string>("Usuarios/registrar", "POST", usuario);
}
