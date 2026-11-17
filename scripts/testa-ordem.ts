// Rode com: node --experimental-strip-types scripts/testa-ordem.ts
import assert from "node:assert/strict";
import { moverId, ordenarPorIds } from "../src/utils/ordem.ts";

// ids numéricos (cards de conta): os que não estão na ordem salva vão para o fim
assert.deepEqual(ordenarPorIds([1, 2, 3, 4], [3, 1], (n) => n), [3, 1, 2, 4]);
// ids em texto (gráficos do dashboard)
const graficos = [{ id: "saidas" }, { id: "entradas" }, { id: "entradas-saidas" }];
assert.deepEqual(
  ordenarPorIds(graficos, ["entradas-saidas", "saidas"], (g) => g.id).map((g) => g.id),
  ["entradas-saidas", "saidas", "entradas"],
);

// arrastando para frente entra depois do destino; para trás, antes
assert.deepEqual(moverId(["a", "b", "c"], "a", "c"), ["b", "c", "a"]);
assert.deepEqual(moverId(["a", "b", "c"], "c", "a"), ["c", "a", "b"]);
assert.deepEqual(moverId(["a", "b", "c"], "a", "x"), ["a", "b", "c"]); // destino inexistente: não mexe

console.log("ordem: ok");
