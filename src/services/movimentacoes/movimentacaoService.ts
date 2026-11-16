import type { Movimentacao } from "../../models/movimentacoes/GetMovimentacoes";
import Conecta from "../api/apiConnect";

// Movimentação virtual (id 0, gerada por um agendamento) vira uma movimentação real.
export const materializarMovimentacao = (mov: Movimentacao) =>
  Conecta<{ valor: Movimentacao }>(
    `/Contas/${mov.idConta}/Movimentacoes/Fixa/${mov.idFixo}/Materializa`,
    "POST",
    { dataMovimentacao: new Date(mov.dthrMovimentacao).toISOString() },
  );

export const alterarCategoriasMovimentacao = (
  idMovimentacao: number,
  categorias: number[],
) =>
  Conecta<string>(
    `Contas/Movimentacoes/${idMovimentacao}/Alterar/Categoria`,
    "PUT",
    { categorias },
  );

// mesma seleção em qualquer ordem (copia antes de ordenar: os arrays podem ser estado do React)
export const mesmasCategorias = (a: number[], b: number[]) => {
  const ordenadas = (ids: number[]) => [...ids].sort().join();
  return ordenadas(a) === ordenadas(b);
};
