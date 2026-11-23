import type { CategoriaResponse } from "../models/categorias/Categoria";
import { useBuscaApi } from "./useBuscaApi";

// Categorias da conta: busca ao montar; buscarCategorias atualiza depois de alterar.
export function useCategorias(idConta: number) {
  const { dados, buscar } = useBuscaApi<CategoriaResponse>(
    `/Contas/${idConta}/Categorias`,
  );
  return { categorias: dados?.conteudo ?? [], buscarCategorias: buscar };
}
