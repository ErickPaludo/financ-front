// Rode com: node --experimental-strip-types scripts/testa-cor-categoria.ts
import assert from "node:assert/strict";
import { contraste, coresChipCategoria, corParaTextoBranco } from "../src/utils/corCategoria.ts";

assert.equal(Math.round(contraste([0, 0, 0], [255, 255, 255])), 21);

// cores claras, médias e escuras: o texto do chip sempre passa de 4.5:1
for (const cor of ["#ffff00", "#22c55e", "#2563eb", "#ef4444", "#fff", "#000000", "#f59e0b", "#a855f7"]) {
  const c = coresChipCategoria(cor)!;
  assert.ok(c, cor);
  assert.ok(contraste(c.rgbTexto, c.rgbFundo) >= 4.5, `${cor}: ${c.texto} sobre ${c.fundo}`);
}

assert.equal(coresChipCategoria("azul"), null);
assert.equal(coresChipCategoria(""), null);
// avatar da conta: branco sobre a cor (escurecida se preciso) passa de 4.5:1
const rgb = (c: string) => c.match(/\d+/g)!.map(Number) as [number, number, number];
for (const cor of ["#ffff00", "#ffffff", "#22c55e", "#155dfc", "#000000"]) {
  assert.ok(contraste([255, 255, 255], rgb(corParaTextoBranco(cor))) >= 4.5, cor);
}
assert.equal(corParaTextoBranco("#000000"), "rgb(0, 0, 0)"); // já escura: não muda
assert.equal(corParaTextoBranco("azul"), "azul");
console.log("ok");
