// Rode com: node --experimental-strip-types scripts/testa-preferencias-tabela.ts
import assert from "node:assert/strict";
import {
  moverItem,
  normalizarPreferencias,
  ordenarLinhas,
} from "../src/componentes/tabela-dados/preferenciasTabela.ts";

const chaves = ["a", "b", "c"];
assert.deepEqual(normalizarPreferencias(null, chaves), {
  ordem: ["a", "b", "c"],
  ocultas: [],
  ordenacao: null,
});
// coluna removida some, coluna nova vai para o fim
assert.deepEqual(
  normalizarPreferencias(
    { ordem: ["c", "x", "a"], ocultas: ["x", "b"] },
    chaves,
  ),
  { ordem: ["c", "a", "b"], ocultas: ["b"], ordenacao: null },
);
// lixo no storage não quebra; todas ocultas vira nenhuma
assert.deepEqual(
  normalizarPreferencias(
    {
      ordem: "oi",
      ocultas: ["a", "b", "c"],
      ordenacao: { chave: "z", direcao: "asc" },
    },
    chaves,
  ),
  { ordem: chaves, ocultas: [], ordenacao: null },
);
assert.deepEqual(
  normalizarPreferencias({ ordenacao: { chave: "b", direcao: "desc" } }, chaves)
    .ordenacao,
  { chave: "b", direcao: "desc" },
);

assert.deepEqual(moverItem(["a", "b", "c"], 0, 2), ["b", "c", "a"]);
assert.deepEqual(moverItem(["a", "b", "c"], 0, -1), ["a", "b", "c"]);

const v = (x: unknown) => x;
assert.deepEqual(ordenarLinhas([10, 2, null, 33], v, "asc"), [2, 10, 33, null]);
assert.deepEqual(ordenarLinhas([10, 2, null, 33], v, "desc"), [
  33,
  10,
  2,
  null,
]);
// texto: ignora acento/maiúscula e compara números dentro do texto
assert.deepEqual(ordenarLinhas(["item 10", "Item 2", "ágHa"], v, "asc"), [
  "ágHa",
  "Item 2",
  "item 10",
]);
console.log("ok");
