// Rode com: node --experimental-strip-types scripts/testa-categorias-em-massa.ts
import assert from "node:assert/strict";
import { categoriasResultantes } from "../src/telas/movimentacoes/acoes-em-massa/categoriasEmMassa.ts";

// adicionar: mantém as atuais e não repete
assert.deepEqual(categoriasResultantes([1, 2], [2, 3], "adicionar"), [1, 2, 3]);
assert.deepEqual(categoriasResultantes([], [3], "adicionar"), [3]);

// remover: tira só as escolhidas; escolhida que ela não tem não muda nada
assert.deepEqual(categoriasResultantes([1, 2, 3], [2, 9], "remover"), [1, 3]);
assert.deepEqual(categoriasResultantes([1], [1], "remover"), []);

// substituir: fica exatamente com as escolhidas (vazio = sem categoria)
assert.deepEqual(categoriasResultantes([1, 2], [3], "substituir"), [3]);
assert.deepEqual(categoriasResultantes([1, 2], [], "substituir"), []);

console.log("categorias em massa: ok");
