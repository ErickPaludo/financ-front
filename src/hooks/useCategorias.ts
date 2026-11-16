import { useCallback, useEffect, useState } from "react";

import type {
  Categoria,
  CategoriaResponse,
} from "../models/categorias/Categorias";
import Conecta from "../services/api/apiConnect";

// Categorias da conta: busca ao montar; buscarCategorias atualiza depois de alterar.
export function useCategorias(idConta: number) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const buscarCategorias = useCallback(
    () =>
      Conecta<CategoriaResponse>(`/Contas/${idConta}/Categorias`, "GET").then(
        (resposta) => {
          if (resposta.sucesso && resposta.dados)
            setCategorias(resposta.dados.conteudo);
        },
      ),
    [idConta],
  );

  useEffect(() => {
    buscarCategorias();
  }, [buscarCategorias]);

  return { categorias, buscarCategorias };
}
