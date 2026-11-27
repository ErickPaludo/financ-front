// Rode com: node --experimental-strip-types scripts/testa-data-em-massa.ts
import assert from "node:assert/strict";
import { comDia } from "../src/telas/movimentacoes/acoes-em-massa/dataEmMassa.ts";

// troca só o dia: mês, ano e hora ficam
assert.equal(comDia("2026-11-26T14:30", 5), "2026-11-05T14:30");
assert.equal(comDia("2026-01-01T00:00", 31), "2026-01-31T00:00");

// dia que o mês não tem: último dia do mês, sem pular de mês
assert.equal(comDia("2026-02-10T08:00", 31), "2026-02-28T08:00");
assert.equal(comDia("2028-02-10T08:00", 30), "2028-02-29T08:00"); // bissexto
assert.equal(comDia("2026-04-15T23:59", 31), "2026-04-30T23:59");

console.log("data em massa: ok");
