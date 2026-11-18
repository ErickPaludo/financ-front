import type { GetContaUsuario } from "../../models/contas-usuarios/GetContaUsuario";
import type { ContaResponse } from "../../models/contas-usuarios/GetContasBancarias";
import Conecta from "../api/apiConnect";

const ROTA = "/ContasUsuarios";

// Contas do usuário; com id, só aquela conta (em `conteudo.contas[0]`).
export const buscarContas = (idConta?: number) =>
  Conecta<ContaResponse>(idConta === undefined ? ROTA : `${ROTA}?id=${idConta}`, "GET");

// Vínculo do usuário com a conta (permissão, expiração). A lista de contas não traz a permissão.
export const buscarContaUsuario = (idConta: number, idUsuario?: string) =>
  Conecta<GetContaUsuario>(
    `${ROTA}/${idConta}/associados?IdUsuario=${idUsuario}`,
    "GET",
  );

export const sairDaConta = (idConta: number) =>
  Conecta<string>(`${ROTA}/${idConta}/sair`, "POST");

export const alternarFavorita = (idConta: number) =>
  Conecta<string>(`${ROTA}/${idConta}/Favorita`, "POST");

export const alternarSomaSaldo = (idConta: number) =>
  Conecta<string>(`${ROTA}/${idConta}/AutoSoma`, "POST");
