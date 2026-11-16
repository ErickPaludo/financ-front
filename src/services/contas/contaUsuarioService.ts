import type { GetContaUsuario } from "../../models/contas-usuarios/GetContaUsuario";
import Conecta from "../api/apiConnect";

// Vínculo do usuário com a conta (permissão, expiração). A lista de contas não traz a permissão.
export const buscarContaUsuario = (idConta: number, idUsuario?: string) =>
  Conecta<GetContaUsuario>(
    `/ContasUsuarios/${idConta}/associados?IdUsuario=${idUsuario}`,
    "GET",
  );
