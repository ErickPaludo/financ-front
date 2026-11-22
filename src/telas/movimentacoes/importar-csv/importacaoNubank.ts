// Leitura do CSV da fatura do cartão do Nubank (date,title,amount) e a data da fatura de cada compra.
// com extensão: scripts/testa-importacao-nubank.ts roda este arquivo direto no Node
import dayjs from "dayjs";

import { FORMATO_DATA_HORA } from "../../../utils/formatacao.ts";

// valor sempre positivo; receita = reembolso (estorno de compra, crédito de parcelamento)
export type LinhaNubank = {
  data: string;
  titulo: string;
  valor: number;
  receita: boolean;
};

// Movimento do pagamento da fatura, não gasto nem reembolso (o dinheiro sai da conta em outro lançamento).
const IGNORADOS = ["pagamento recebido", "estorno de pagamento"];

// "-84.62" (até fev/2026) ou "- 1.056,97" (desde mar/2026: vírgula decimal, ponto de milhar, espaço no sinal).
export const lerValor = (texto: string) => {
  const limpo = texto.replace(/\s/g, "");
  return Number(
    limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo,
  );
};

// Separa os campos de uma linha; título entre aspas pode ter vírgula ("" é aspas).
const campos = (linha: string) => {
  const saida: string[] = [];
  let atual = "";
  let entreAspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (entreAspas) {
      if (c === '"' && linha[i + 1] === '"') atual += linha[++i];
      else if (c === '"') entreAspas = false;
      else atual += c;
    } else if (c === '"') entreAspas = true;
    else if (c === ",") {
      saida.push(atual);
      atual = "";
    } else atual += c;
  }
  saida.push(atual);
  return saida.map((campo) => campo.trim());
};

// Gasto (positivo) vira despesa; negativo vira receita, menos os pagamentos da fatura (IGNORADOS).
export const lerCsvNubank = (
  texto: string,
): { linhas: LinhaNubank[]; ignoradas: number } | { erro: string } => {
  const [cabecalho, ...resto] = texto.trim().split(/\r?\n/);
  if (
    campos(cabecalho ?? "")
      .join(",")
      .toLowerCase() !== "date,title,amount"
  )
    return {
      erro: 'Arquivo fora do padrão do Nubank: a primeira linha deve ser "date,title,amount".',
    };
  const linhas: LinhaNubank[] = [];
  let ignoradas = 0;
  for (const [i, bruta] of resto.entries()) {
    if (!bruta.trim()) continue;
    const [data, titulo, valorTexto] = campos(bruta);
    const valor = lerValor(valorTexto ?? "");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
      !dayjs(data).isValid() ||
      !titulo ||
      !valorTexto ||
      Number.isNaN(valor)
    )
      return { erro: `Linha ${i + 2} inválida: "${bruta}".` };
    if (valor === 0 || IGNORADOS.includes(titulo.toLowerCase())) ignoradas++;
    else
      linhas.push({
        data,
        titulo: titulo.slice(0, 255),
        valor: Math.abs(valor),
        receita: valor < 0,
      });
  }
  return { linhas, ignoradas };
};

// Compra antes do dia da virada fica na fatura do mesmo mês; no dia ou depois, na do mês seguinte.
// A data é o dia anterior à virada no mês da fatura (virada 1: último dia do mês anterior).
export const dataDaFatura = (dataCompra: string, diaVirada: number) => {
  const compra = dayjs(dataCompra);
  return compra
    .add(compra.date() >= diaVirada ? 1 : 0, "month")
    .date(diaVirada - 1)
    .startOf("day")
    .format(FORMATO_DATA_HORA);
};
