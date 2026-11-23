import { colunasExportacao, type LinhaExportada } from "./colunasExportacao.ts";

// Texto vindo de outros membros da conta: começando com = + - @ o Excel executaria como fórmula
// (número negativo, como o valor, é só número).
const semFormula = (valor: string) =>
  /^[=+\-@\t\r]/.test(valor) && !/^-[\d.,]+$/.test(valor) ? `'${valor}` : valor;

// campo com ; aspas ou quebra de linha vai entre aspas ("" é aspas)
const campo = (valor: string) =>
  /[;"\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;

// ";" e vírgula decimal: o Excel em português abre direto, com as colunas separadas.
// Com sinal, como na tabela: o "Extrato da conta" do Importar CSV lê de volta.
export const gerarCsv = (movimentacoes: LinhaExportada[]) => {
  const colunas = colunasExportacao((v) => v.toFixed(2).replace(".", ","));
  return [
    colunas.map(([titulo]) => titulo),
    ...movimentacoes.map((mov) => colunas.map(([, valor]) => valor(mov))),
  ]
    .map((linha) => linha.map((v) => campo(semFormula(v))).join(";"))
    .join("\r\n");
};
