// Rode com: node --experimental-strip-types scripts/testa-periodo.ts
import assert from "node:assert/strict";
import dayjs from "dayjs";
import {
  alterarFim,
  alterarInicio,
  atalhosPeriodo,
  diasDoPeriodo,
  foraDosLimites,
  limitesDatas,
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

// limites com "hoje" fixo: cada data entre 18/11/1926 00:00 e 18/11/2126 23:59
const hoje = dayjs("2026-11-18T14:00");
assert.deepEqual(limitesDatas(hoje), {
  minimo: "1926-11-18T00:00",
  maximo: "2126-11-18T23:59",
});
// data fora dos limites vai até o limite
assert.deepEqual(alterarInicio(nov, "1900-01-01T00:00", hoje), {
  inicio: "1926-11-18T00:00",
  fim: "2026-11-18T00:00", // e o fim acompanha: no máximo 100 anos de período
});
assert.equal(alterarFim(nov, "2200-12-31T23:59", hoje).fim, "2126-11-18T23:59");
// período acima de 100 anos: a outra data é puxada até o limite
const longo = { inicio: "2026-01-01T00:00", fim: "2120-01-01T00:00" };
assert.deepEqual(alterarInicio(longo, "2000-01-01T00:00", hoje), {
  inicio: "2000-01-01T00:00",
  fim: "2100-01-01T00:00",
});
assert.deepEqual(alterarFim(nov, "2126-11-01T00:00", hoje), {
  inicio: "2026-11-01T00:00", // exatamente 100 anos: vale
  fim: "2126-11-01T00:00",
});
assert.deepEqual(alterarFim({ inicio: "2000-01-01T00:00", fim: "2026-01-01T00:00" }, "2110-01-01T00:00", hoje), {
  inicio: "2010-01-01T00:00",
  fim: "2110-01-01T00:00",
});
// seta que passaria do limite não anda
const noLimite = { inicio: "2126-11-01T00:00", fim: "2126-11-15T23:59" };
assert.deepEqual(moverPeriodo(noLimite, 1, hoje), noLimite);
assert.deepEqual(foraDosLimites(noLimite, hoje), false);

const [hojeAtalho, esteMes, mesPassado, proximoMes, ultimos7, ultimos30, esteAno] = atalhosPeriodo(
  dayjs("2026-11-18T14:00"),
);
assert.deepEqual(hojeAtalho.periodo, {
  inicio: "2026-11-18T00:00",
  fim: "2026-11-18T23:59",
});
assert.equal(diasDoPeriodo(hojeAtalho.periodo), 1);
assert.deepEqual(esteMes.periodo, nov);
assert.deepEqual(mesPassado.periodo, {
  inicio: "2026-10-01T00:00",
  fim: "2026-10-31T23:59",
});
assert.deepEqual(proximoMes.periodo, {
  inicio: "2026-12-01T00:00",
  fim: "2026-12-31T23:59",
});
assert.deepEqual(ultimos7.periodo, {
  inicio: "2026-11-12T00:00",
  fim: "2026-11-18T23:59",
});
assert.equal(diasDoPeriodo(ultimos7.periodo), 7);
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
