import assert from "node:assert";
import {
  acrescentar,
  calcular,
  paraExpressao,
} from "../src/componentes/calculadora/regrasCalculadora.ts";

const digitar = (teclas: string[]) => teclas.reduce(acrescentar, "");

assert.strictEqual(calcular("2+3×4"), 14);
assert.strictEqual(calcular("10−4÷2"), 8);
assert.strictEqual(calcular("8÷2×3"), 12);
assert.strictEqual(calcular("0,1+0,2"), 0.3);
assert.strictEqual(calcular("−5+2"), -3);
assert.strictEqual(calcular("7×"), 7);
assert.strictEqual(calcular("5÷0"), null);
assert.strictEqual(calcular(""), null);
assert.strictEqual(calcular("1−1"), 0);

assert.strictEqual(digitar(["5", "+", "×"]), "5×");
assert.strictEqual(digitar(["+"]), "");
assert.strictEqual(digitar(["−", "+"]), "−");
assert.strictEqual(digitar([",", "5", ","]), "0,5");
assert.strictEqual(digitar(["1", ",", "5", "+", ","]), "1,5+0,");

assert.strictEqual(paraExpressao(-2.5), "−2,5");
assert.strictEqual(paraExpressao(1e21), "1000000000000000000000");

console.log("calculadora: ok");
