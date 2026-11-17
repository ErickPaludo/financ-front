// Rode com: node --experimental-strip-types scripts/testa-cor-categoria.ts
import assert from "node:assert/strict";
import { contraste, coresChipCategoria, corParaTextoBranco } from "../src/utils/corCategoria.ts";

const rgb = (c: string) => c.match(/\d+/g)!.map(Number) as [number, number, number];
assert.equal(Math.round(contraste([0, 0, 0], [255, 255, 255])), 21);

// cores claras, médias e escuras: fundo = cor da API e o texto sempre passa de 3:1
for (const cor of ["#ffff00", "#22c55e", "#2563eb", "#ef4444", "#fff", "#000000", "#f59e0b", "#a855f7"]) {
  const c = coresChipCategoria(cor)!;
  assert.ok(c, cor);
  assert.deepEqual(c.rgbFundo, rgb(c.fundo), cor);
  assert.ok(contraste(c.rgbTexto, c.rgbFundo) >= 3, `${cor}: ${c.texto} sobre ${c.fundo}`);
}
// paleta do SeletorCor (laranja, verde, ciano...): texto branco, não preto apagado
for (const cor of ["#155dfc", "#e60076", "#f54900", "#e17100", "#00a63e", "#009966", "#0092b8"]) {
  assert.equal(coresChipCategoria(cor)!.texto, "rgb(255, 255, 255)", cor);
}

assert.equal(coresChipCategoria("#2563eb")!.fundo, "rgb(37, 99, 235)"); // cor exata, sem clarear
assert.equal(coresChipCategoria("#ffff00")!.texto, "rgb(0, 0, 0)"); // cor clara: preto
assert.equal(coresChipCategoria("azul"), null);
assert.equal(coresChipCategoria(""), null);
// avatar da conta: branco sobre a cor (escurecida se preciso) passa de 4.5:1

for (const cor of ["#ffff00", "#ffffff", "#22c55e", "#155dfc", "#000000"]) {
  assert.ok(contraste([255, 255, 255], rgb(corParaTextoBranco(cor))) >= 4.5, cor);
}
assert.equal(corParaTextoBranco("#000000"), "rgb(0, 0, 0)"); // já escura: não muda
assert.equal(corParaTextoBranco("azul"), "azul");
console.log("ok");

// paleta das categorias: texto branco legível (4.5:1) em todas
import { CORES_CATEGORIA } from "../src/utils/corCategoria.ts";
for (const { nome, valor } of CORES_CATEGORIA) {
  const c = coresChipCategoria(valor)!;
  assert.equal(c.texto, "rgb(255, 255, 255)", nome);
  assert.ok(contraste(c.rgbTexto, c.rgbFundo) >= 4.5, `${nome} ${valor}`);
}
console.log("paleta ok");
