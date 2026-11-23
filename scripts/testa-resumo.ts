// Rode com: node --experimental-strip-types scripts/testa-resumo.ts
import assert from "node:assert/strict";
import { resumoSem } from "../src/telas/movimentacoes/resumo.ts";

const resumo = {
  saldoReal: 1000,
  saldoRealProjetado: 900,
  saldoRealizado: 300, // 500 − 200
  saldoProjetado: 250, // 600 − 350
  entrada: { concluidos: 500, pendentes: 100, projetado: 600 },
  saida: { concluidos: 200, pendentes: 150, projetado: 350 },
};

// nada escondido: o mesmo resumo
assert.deepEqual(resumoSem(resumo, []), resumo);

// despesa concluída de 50 e receita pendente de 100 escondidas
assert.deepEqual(
  resumoSem(resumo, [
    { tipo: 1, valor: 50, concluido: true },
    { tipo: 0, valor: 100, concluido: false },
  ]),
  {
    saldoReal: 1000, // da conta: não muda
    saldoRealProjetado: 900,
    saldoRealizado: 350,
    saldoProjetado: 200,
    entrada: { concluidos: 500, pendentes: 0, projetado: 500 },
    saida: { concluidos: 150, pendentes: 150, projetado: 300 },
  },
);

console.log("resumo: ok");
