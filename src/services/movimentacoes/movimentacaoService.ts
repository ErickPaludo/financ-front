import type { Movimentacao } from "../../models/movimentacoes/GetMovimentacoes";
import type { ApiResult } from "../../models/interface/ApiResult";
import type { MovimentacaoPatch } from "../../models/movimentacoes/MovimentacaoPatch";
import type { MovimentacaoPost } from "../../models/movimentacoes/MovimentacaoPost";
import Conecta from "../api/apiConnect";

// Cadastro (nova transação, transferência, importação). A API devolve { valor: Movimentacao }.
export const cadastrarMovimentacao = (
  idConta: number,
  movimentacao: MovimentacaoPost,
) =>
  Conecta<{ valor?: Movimentacao }>(
    `/Contas/${idConta}/Movimentacoes`,
    "POST",
    movimentacao,
  );

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

// Ação de uma movimentação da lista (exclusão, conclusão, extorno em massa). A virtual (de
// agendamento) vira real antes, como no popup da linha. Devolve a mensagem de erro, ou nada.
const naMovimentacao = async (
  mov: Movimentacao,
  acao: (idMov: number) => Promise<ApiResult<unknown>>,
  erroPadrao: string,
) => {
  let idMov = mov.id;
  if (idMov === 0) {
    const materializada = await materializarMovimentacao(mov);
    if (!materializada.sucesso || !materializada.dados)
      return materializada.erro ?? "Erro ao materializar movimentação.";
    idMov = materializada.dados.valor.id;
  }
  const resposta = await acao(idMov);
  if (!resposta.sucesso) return resposta.erro ?? erroPadrao;
};

export const removerMovimentacao = (mov: Movimentacao) =>
  naMovimentacao(
    mov,
    (id) => Conecta<string>(`/Contas/Movimentacoes/${id}/Remover`, "DELETE"),
    "Não foi possível excluir a movimentação.",
  );

// dthrConclusao em ISO UTC
export const concluirMovimentacao = (
  mov: Movimentacao,
  dthrConclusao: string,
) =>
  naMovimentacao(
    mov,
    (id) =>
      Conecta<string>(`/Contas/Movimentacoes/${id}/Concluir`, "POST", {
        dthrConclusao,
      }),
    "Não foi possível concluir a movimentação.",
  );

// dthrMovimentacao em ISO UTC; os outros campos ficam como estão (null no PATCH = não altera)
export const alterarDataMovimentacao = (
  mov: Movimentacao,
  dthrMovimentacao: string,
) =>
  naMovimentacao(
    mov,
    (id) =>
      Conecta<string>(`Contas/Movimentacoes/${id}/Alterar`, "PATCH", {
        dthrMovimentacao,
      } satisfies MovimentacaoPatch),
    "Não foi possível alterar a data da movimentação.",
  );

export const extornarMovimentacao = (mov: Movimentacao) =>
  naMovimentacao(
    mov,
    (id) => Conecta<string>(`/Contas/Movimentacoes/${id}/Extornar`, "POST"),
    "Não foi possível extornar a movimentação.",
  );
