// Rode com: node --experimental-strip-types scripts/testa-agrupamento.ts
import assert from "node:assert/strict";
import { agruparPorCategoria, agruparPorPeriodo } from "../src/telas/dashboard/agrupamento.ts";

const mov = (tipo: number, valor: number, data: string) => ({ tipo, valor, dthrMovimentacao: data });

// por dia: período inteiro, dias vazios com zero, entradas e saídas separadas
const dias = agruparPorPeriodo(
  [mov(0, 100, "2026-11-02T10:00"), mov(1, 30, "2026-11-02T18:00"), mov(1, 20, "2026-11-04T09:00"), mov(0, 999, "2026-12-01T00:00")],
  "2026-11-01T00:00",
  "2026-11-05T23:59",
);
assert.deepEqual(dias.map((p) => p.rotulo), ["01/11", "02/11", "03/11", "04/11", "05/11"]);
assert.deepEqual(dias[1], { rotulo: "02/11", entradas: 100, saidas: 30 });
assert.deepEqual(dias[3], { rotulo: "04/11", entradas: 0, saidas: 20 });
assert.equal(dias.reduce((s, p) => s + p.entradas, 0), 100); // a de dezembro ficou de fora

// período longo: por mês
const meses = agruparPorPeriodo([mov(0, 50, "2026-03-15T12:00")], "2026-01-01T00:00", "2026-06-30T23:59");
assert.equal(meses.length, 6);
assert.deepEqual(meses[2], { rotulo: "03/2026", entradas: 50, saidas: 0 });

// pizza por categoria: só o tipo pedido, valor dividido entre as categorias, sem categoria à parte
const cat = (idCategoria: number, nome: string) => ({ idCategoria, nome, cor: "#123456" });
const fatias = agruparPorCategoria(
  [
    { tipo: 1, valor: 100, categorias: [cat(1, "Mercado")] },
    { tipo: 1, valor: 60, categorias: [cat(1, "Mercado"), cat(2, "Casa")] },
    { tipo: 1, valor: 10, categorias: [] },
    { tipo: 0, valor: 500, categorias: [cat(3, "Salário")] },
    { tipo: 1, valor: 0, categorias: [cat(4, "Sem uso")] }, // R$ 0: não aparece
  ],
  1,
  { nome: "Sem categoria", cor: "#999999" },
);
assert.deepEqual(fatias.map((f) => [f.label, f.value]), [["Mercado", 130], ["Casa", 30], ["Sem categoria", 10]]);
assert.equal(fatias.reduce((s, f) => s + f.value, 0), 170); // soma = total de saídas, sem contar duas vezes
assert.equal(fatias[2].color, "#999999");

console.log("agrupamento: ok");
