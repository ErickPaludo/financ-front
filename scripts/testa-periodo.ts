// Rode com: node --experimental-strip-types scripts/testa-periodo.ts
import assert from "node:assert/strict";
import dayjs from "dayjs";
import {
  alterarFim,
  alterarInicio,
  atalhosPeriodo,
  diasDoPeriodo,
  moverPeriodo,
} from "../src/telas/movimentacoes/filtro-periodo/periodo.ts";

const nov = { inicio: "2026-11-01T00:00", fim: "2026-11-30T23:59" };
assert.equal(diasDoPeriodo(nov), 30);
assert.equal(
  diasDoPeriodo({ inicio: "2026-11-05T10:00", fim: "2026-11-05T12:00" }),
  1,
);

// mês inteiro anda em meses, inclusive para meses de tamanhos diferentes e virada de ano
assert.deepEqual(moverPeriodo(nov, 1), {
  inicio: "2026-12-01T00:00",
  fim: "2026-12-31T23:59",
});
assert.deepEqual(moverPeriodo(nov, -1), {
  inicio: "2026-10-01T00:00",
  fim: "2026-10-31T23:59",
});
assert.deepEqual(
  moverPeriodo({ inicio: "2026-11-01T00:00", fim: "2026-12-31T23:59" }, 1),
  { inicio: "2027-01-01T00:00", fim: "2027-02-28T23:59" },
);
assert.deepEqual(
  moverPeriodo({ inicio: "2026-01-01T00:00", fim: "2026-12-31T23:59" }, -1),
  { inicio: "2025-01-01T00:00", fim: "2025-12-31T23:59" },
);

// fora de mês inteiro anda o número de dias, mantendo os horários
assert.deepEqual(
  moverPeriodo({ inicio: "2026-11-01T00:00", fim: "2026-11-15T23:59" }, 1),
  { inicio: "2026-11-16T00:00", fim: "2026-11-30T23:59" },
);
assert.deepEqual(
  moverPeriodo({ inicio: "2026-11-10T08:00", fim: "2026-11-12T18:00" }, -1),
  { inicio: "2026-11-07T08:00", fim: "2026-11-09T18:00" },
);

// um lado acompanha o outro
assert.deepEqual(alterarInicio(nov, "2026-12-05T00:00"), {
  inicio: "2026-12-05T00:00",
  fim: "2026-12-05T00:00",
});
assert.deepEqual(alterarFim(nov, "2026-10-20T00:00"), {
  inicio: "2026-10-20T00:00",
  fim: "2026-10-20T00:00",
});
assert.deepEqual(alterarInicio(nov, "2026-11-10T00:00"), {
  inicio: "2026-11-10T00:00",
  fim: nov.fim,
});

const [esteMes, mesPassado, ultimos30, esteAno] = atalhosPeriodo(
  dayjs("2026-11-18T14:00"),
);
assert.deepEqual(esteMes.periodo, nov);
assert.deepEqual(mesPassado.periodo, {
  inicio: "2026-10-01T00:00",
  fim: "2026-10-31T23:59",
});
assert.deepEqual(ultimos30.periodo, {
  inicio: "2026-10-20T00:00",
  fim: "2026-11-18T23:59",
});
assert.equal(diasDoPeriodo(ultimos30.periodo), 30);
assert.deepEqual(esteAno.periodo, {
  inicio: "2026-01-01T00:00",
  fim: "2026-12-31T23:59",
});

console.log("ok");
