import { cadastrarMovimentacao } from "../movimentacaoService";
import {
  montarMovimentacao,
  type LinhaImportada,
  type OpcoesImportacao,
} from "./conversaoMovimentacoes";

// Cria as movimentações importadas, um POST por vez (em paralelo, uma falha no meio deixaria
// buracos difíceis de retomar). Começa em `aPartirDe`: enviar de novo continua da que falhou,
// sem duplicar as já criadas. Devolve quantas existem ao parar e, se parou, o motivo.
export const importarMovimentacoes = async (
  idConta: number,
  linhas: LinhaImportada[],
  opcoes: OpcoesImportacao,
  {
    aPartirDe = 0,
    aoCriar,
  }: { aPartirDe?: number; aoCriar?: (criadas: number) => void } = {},
): Promise<{ criadas: number; erro?: string }> => {
  for (let i = aPartirDe; i < linhas.length; i++) {
    const resposta = await cadastrarMovimentacao(
      idConta,
      montarMovimentacao(linhas[i], opcoes),
    );
    if (!resposta.sucesso)
      return {
        criadas: i,
        erro: `${i} de ${linhas.length} movimentações criadas (falhou em "${linhas[i].titulo}"). ${resposta.erro ?? "Erro ao cadastrar movimentação."} Envie de novo para criar as que faltam.`,
      };
    aoCriar?.(i + 1);
  }
  return { criadas: linhas.length };
};
