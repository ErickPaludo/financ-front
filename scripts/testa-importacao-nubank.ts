// Rode com: node --experimental-strip-types scripts/testa-importacao-nubank.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  dataDaFatura,
  lerCsvNubank,
  lerValor,
} from "../src/telas/movimentacoes/importar-csv/importacaoNubank.ts";

// virada no dia 11: antes fica no mês, no dia 11 ou depois vai para o seguinte; sempre no dia 10
assert.equal(dataDaFatura("2024-01-05", 11), "2024-01-10T00:00");
assert.equal(dataDaFatura("2023-12-20", 11), "2024-01-10T00:00");
assert.equal(dataDaFatura("2023-12-11", 11), "2024-01-10T00:00");
assert.equal(dataDaFatura("2023-12-10", 11), "2023-12-10T00:00");
assert.equal(dataDaFatura("2023-12-03", 11), "2023-12-10T00:00");
// virada no dia 1: toda compra vai para o mês seguinte, cujo dia 0 é o último do mês da compra
assert.equal(dataDaFatura("2024-02-15", 1), "2024-02-29T00:00");
// virada de ano
assert.equal(dataDaFatura("2023-12-28", 5), "2024-01-04T00:00");

const exemplo = lerCsvNubank(readFileSync("Nubank_2024-01-18.csv", "utf8"));
assert.ok("linhas" in exemplo);
assert.equal(exemplo.linhas.length, 9);
assert.equal(exemplo.ignoradas, 2);
assert.deepEqual(exemplo.linhas[0], {
  data: "2024-01-03",
  titulo: "Google Tinder",
  valor: 9,
  receita: false,
});

// os dois formatos de valor do Nubank (o de vírgula desde mar/2026)
assert.equal(lerValor("-84.62"), -84.62);
assert.equal(lerValor("9.00"), 9);
assert.equal(lerValor("- 1.056,97"), -1056.97);
assert.equal(lerValor("29,55"), 29.55);

// reembolso vira receita; pagamento da fatura e estorno de pagamento ficam de fora
const negativos = lerCsvNubank(
  [
    "date,title,amount",
    '2026-03-06,Pagamento recebido,"- 831,47"',
    "2025-09-08,Estorno de pagamento,-0.01",
    '2025-07-29,"Estorno de ""Mercadopago *Villages""",-39.51',
    '2026-05-12,Estorno de Amazon BR V - NuPay,"- 19,73"',
    "2025-02-13,Crédito de parcelamento de compra,-225.00",
    '2026-03-06,Jardim Gastronomia,"9,00"',
  ].join("\n"),
);
assert.ok("linhas" in negativos);
assert.equal(negativos.ignoradas, 2);
assert.deepEqual(
  negativos.linhas.map((l) => [l.titulo, l.valor, l.receita]),
  [
    ['Estorno de "Mercadopago *Villages"', 39.51, true],
    ["Estorno de Amazon BR V - NuPay", 19.73, true],
    ["Crédito de parcelamento de compra", 225, true],
    ["Jardim Gastronomia", 9, false],
  ],
);

const aspas = lerCsvNubank(
  'date,title,amount\r\n2024-01-03,"Loja, ""X""",10.5\r\n',
);
assert.ok("linhas" in aspas);
assert.equal(aspas.linhas[0].titulo, 'Loja, "X"');

// arquivo salvo com BOM (Excel)
assert.ok(
  "linhas" in
    lerCsvNubank(
      String.fromCharCode(0xfeff) + "date,title,amount\n2024-01-03,a,1",
    ),
);

assert.ok("erro" in lerCsvNubank("data,titulo,valor\n2024-01-03,a,1"));
assert.ok("erro" in lerCsvNubank("date,title,amount\n03/01/2024,a,1"));
assert.ok("erro" in lerCsvNubank("date,title,amount\n2024-01-03,a,abc"));

console.log("importacaoNubank: ok");
