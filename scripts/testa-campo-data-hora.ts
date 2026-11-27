import assert from "node:assert/strict";

import {
  editarDataHora,
  estaCompleto,
  lerDataHora,
  mascararDataHora,
  textoDaData,
  VAZIO,
} from "../src/props/campo-data-hora/textoDataHora.ts";

const base = "26/11/2026 14:30";
const inserir = (dados: string) => ({ tipo: "inserir", dados }) as const;
const apagar = (paraTras: boolean) => ({ tipo: "apagar", paraTras }) as const;

// selecionar o ano e digitar troca só o ano (o relato do usuário)
let r = editarDataHora(base, 6, 10, inserir("2"));
assert.deepEqual(r, { texto: "26/11/2___ 14:30", cursor: 7 });
for (const d of "025") r = editarDataHora(r.texto, r.cursor, r.cursor, inserir(d));
assert.deepEqual(r, { texto: "26/11/2025 14:30", cursor: 11 });
assert.equal(lerDataHora(r.texto), "2025-11-26T14:30");

// digitar sobrescreve, sem empurrar; antes de uma barra pula para a próxima vaga
assert.deepEqual(editarDataHora(base, 0, 0, inserir("0")), {
  texto: "06/11/2026 14:30",
  cursor: 1,
});
assert.deepEqual(editarDataHora(base, 1, 1, inserir("7")), {
  texto: "27/11/2026 14:30",
  cursor: 3,
});
assert.deepEqual(editarDataHora(base, 2, 2, inserir("1")).texto, "26/11/2026 14:30");
assert.deepEqual(editarDataHora(base, 16, 16, inserir("9")).texto, base); // no fim, nada
assert.deepEqual(editarDataHora(base, 0, 0, inserir("a")), { texto: base, cursor: 0 });

// apagar deixa o lugar vazio, sem puxar os outros
assert.deepEqual(editarDataHora(base, 10, 10, apagar(true)), {
  texto: "26/11/202_ 14:30",
  cursor: 9,
});
assert.deepEqual(editarDataHora(base, 3, 3, apagar(true)), {
  texto: "2_/11/2026 14:30",
  cursor: 1,
});
assert.deepEqual(editarDataHora(base, 2, 2, apagar(false)), {
  texto: "26/_1/2026 14:30",
  cursor: 4,
});
assert.deepEqual(editarDataHora(base, 0, 16, apagar(true)), { texto: VAZIO, cursor: 0 });
assert.deepEqual(editarDataHora(base, 0, 0, apagar(true)), { texto: base, cursor: 0 });

// colar com a seleção inteira
assert.equal(
  editarDataHora(base, 0, 16, inserir("01/02/2027 08:05")).texto,
  "01/02/2027 08:05",
);
assert.equal(mascararDataHora("261120261430"), base);
assert.equal(mascararDataHora("2611"), "26/11/____ __:__");

// leitura
assert.equal(lerDataHora(base), "2026-11-26T14:30");
assert.equal(lerDataHora("26/11/2026 __:__", "08:15"), "2026-11-26T08:15");
assert.equal(lerDataHora("26/11/2026 1_:__"), null);
assert.equal(lerDataHora("26/11/2_26 14:30"), null);
assert.equal(lerDataHora("31/02/2026 10:00"), null); // não existe
assert.equal(lerDataHora("26/11/2026 24:00"), null);
assert.equal(lerDataHora("26/13/2026 10:00"), null);
assert.equal(lerDataHora("26/11/0202 10:00"), null);
assert.equal(lerDataHora("29/02/2028 00:00"), "2028-02-29T00:00");

assert.equal(estaCompleto(base), true);
assert.equal(estaCompleto("26/11/2026 __:__"), true);
assert.equal(estaCompleto("26/11/2026 1_:__"), false);
assert.equal(estaCompleto("26/11/20__ 14:30"), false);

assert.equal(textoDaData("2026-11-26T14:30"), base);
assert.equal(textoDaData(""), VAZIO);

console.log("ok");
