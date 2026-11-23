// Rode com: node --experimental-strip-types scripts/testa-agrupamento.ts
import assert from "node:assert/strict";
import {
  agruparCategoriasPorPeriodo,
  agruparPorCategoria,
  agruparPorPeriodo,
  semCategoriasIgnoradas,
} from "../src/telas/dashboard/agrupamento.ts";

const mov = (tipo: number, valor: number, data: string) => ({
  tipo,
  valor,
  dthrMovimentacao: data,
});

// por dia: período inteiro, dias vazios com zero, entradas e saídas separadas
const dias = agruparPorPeriodo(
  [
    mov(0, 100, "2026-11-02T10:00"),
    mov(1, 30, "2026-11-02T18:00"),
    mov(1, 20, "2026-11-04T09:00"),
    mov(0, 999, "2026-12-01T00:00"),
  ],
  "2026-11-01T00:00",
  "2026-11-05T23:59",
);
assert.deepEqual(
  dias.map((p) => p.rotulo),
  ["01/11", "02/11", "03/11", "04/11", "05/11"],
);
assert.deepEqual(dias[1], { rotulo: "02/11", entradas: 100, saidas: 30 });
assert.deepEqual(dias[3], { rotulo: "04/11", entradas: 0, saidas: 20 });
assert.equal(
  dias.reduce((s, p) => s + p.entradas, 0),
  100,
); // a de dezembro ficou de fora

// período longo: por mês
const meses = agruparPorPeriodo(
  [mov(0, 50, "2026-03-15T12:00")],
  "2026-01-01T00:00",
  "2026-06-30T23:59",
);
assert.equal(meses.length, 6);
assert.deepEqual(meses[2], { rotulo: "03/2026", entradas: 50, saidas: 0 });

// pizza por categoria: só o tipo pedido, valor inteiro em cada categoria, sem categoria à parte
const cat = (idCategoria: number, nome: string) => ({
  idCategoria,
  nome,
  cor: "#123456",
});
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
assert.deepEqual(
  fatias.map((f) => [f.label, f.value]),
  [
    ["Mercado", 160],
    ["Casa", 60],
    ["Sem categoria", 10],
  ],
);
assert.equal(
  fatias.reduce((s, f) => s + f.value, 0),
  230,
); // passa das saídas (170): a de 60 conta nas duas
assert.equal(fatias[2].color, "#999999");

// categorias ao longo do tempo: uma série por categoria, valor inteiro como na pizza
const noTempo = agruparCategoriasPorPeriodo(
  [
    {
      tipo: 1,
      valor: 60,
      categorias: [cat(1, "Mercado"), cat(2, "Casa")],
      dthrMovimentacao: "2026-11-02T10:00",
    },
    {
      tipo: 1,
      valor: 10,
      categorias: [],
      dthrMovimentacao: "2026-11-03T10:00",
    },
    {
      tipo: 0,
      valor: 500,
      categorias: [cat(3, "Salário")],
      dthrMovimentacao: "2026-11-02T10:00",
    },
  ],
  1,
  { nome: "Sem categoria", cor: "#999999" },
  "2026-11-01T00:00",
  "2026-11-03T23:59",
);
assert.deepEqual(
  noTempo.categorias.map((c) => c.id),
  [1, 2, 0],
);
assert.deepEqual(noTempo.pontos, [
  { rotulo: "01/11", c1: 0, c2: 0, c0: 0 },
  { rotulo: "02/11", c1: 60, c2: 60, c0: 0 },
  { rotulo: "03/11", c1: 0, c2: 0, c0: 10 },
]);

// ignorar categorias: tira só a ignorada; sai a que ficou sem nenhuma; sem categoria continua
const comCats = (id: number, ...ids: number[]) => ({
  id,
  categorias: ids.map((i) => cat(i, "c" + i)),
});
const restantes = semCategoriasIgnoradas(
  [comCats(1, 1, 2), comCats(2, 2), comCats(3)],
  [2],
);
assert.deepEqual(
  restantes.map((m) => [m.id, m.categorias.map((c) => c.idCategoria)]),
  [
    [1, [1]],
    [3, []],
  ],
);
assert.equal(semCategoriasIgnoradas([comCats(1, 2)], []).length, 1); // nada ignorado: tudo igual

console.log("agrupamento: ok");
