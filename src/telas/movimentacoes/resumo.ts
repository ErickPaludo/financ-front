// com extensão nos testes: scripts/testa-resumo.ts roda este arquivo direto no Node
import type {
  Movimentacao,
  Resumo,
} from "../../models/movimentacoes/GetMovimentacoes";

// Resumo do período (vem pronto da API) sem as movimentações escondidas só na tela (busca e
// categorias ignoradas): desconta a parte de cada uma, sem recalcular o resto.
// shortcut: supõe projetado = concluídos + pendentes e saldos = entradas − saídas; se a API
// incluir algo além das movimentações do período nesses campos, isso continua contando.
export const resumoSem = (
  resumo: Resumo,
  escondidas: Pick<Movimentacao, "tipo" | "valor" | "concluido">[],
): Resumo =>
  escondidas.reduce((r, { tipo, valor, concluido }) => {
    const receita = tipo === 0;
    const lado = receita ? r.entrada : r.saida;
    const novoLado = {
      concluidos: lado.concluidos - (concluido ? valor : 0),
      pendentes: lado.pendentes - (concluido ? 0 : valor),
      projetado: lado.projetado - valor,
    };
    const comSinal = receita ? valor : -valor;
    return {
      ...r,
      saldoRealizado: r.saldoRealizado - (concluido ? comSinal : 0),
      saldoProjetado: r.saldoProjetado - comSinal,
      entrada: receita ? novoLado : r.entrada,
      saida: receita ? r.saida : novoLado,
    };
  }, resumo);
