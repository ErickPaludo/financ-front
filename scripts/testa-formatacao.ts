// Rode com: node --experimental-strip-types scripts/testa-formatacao.ts
import assert from "node:assert/strict";
import dayjs from "dayjs";
import {
  normalizarNome,
  dataHoraLocal,
  datasMensais,
  ehDataCompleta,
  formatarDataHora,
  formatarMoeda,
  iniciais,
  periodoDoMes,
  valorComSinal,
} from "../src/utils/formatacao.ts";
import { nomePermissao, OPCOES_PERMISSAO } from "../src/utils/permissao.ts";

// repetição mensal: janeiro 6x vai até junho; dia 31 volta a 31 quando o mês tem
assert.deepEqual(datasMensais("2026-01-10T08:00", 6).map((d) => d.slice(0, 7)), ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"]);
assert.deepEqual(datasMensais("2026-01-31T08:00", 3), ["2026-01-31T08:00", "2026-02-28T08:00", "2026-03-31T08:00"]);
assert.equal(datasMensais("2026-11-01T00:00", 48).at(-1), "2030-10-01T00:00");

// ano no meio da digitação não conta como data
assert.equal(ehDataCompleta(dayjs("0202-01-01")), false);
assert.equal(ehDataCompleta(dayjs("2026-01-01")), true);
assert.equal(ehDataCompleta(null), false);

// moeda: sem valor vira R$ 0,00 (o Intl usa espaço não separável)
const semEspacoEspecial = (texto: string) => texto.replace(/\s/g, " ");
assert.equal(semEspacoEspecial(formatarMoeda()), "R$ 0,00");
assert.equal(semEspacoEspecial(formatarMoeda(1234.5)), "R$ 1.234,50");
assert.equal(semEspacoEspecial(valorComSinal(-145)), "−R$ 145,00");
// sobra de conta com centavos e -0 viram R$ 0,00, sem sinal de menos
assert.equal(semEspacoEspecial(formatarMoeda(-0.0000001)), "R$ 0,00");
assert.equal(semEspacoEspecial(formatarMoeda(-0)), "R$ 0,00");
assert.equal(semEspacoEspecial(formatarMoeda(0.1 + 0.2 - 0.3)), "R$ 0,00");
assert.equal(semEspacoEspecial(valorComSinal(-0.0000001)), "+R$ 0,00");

// período do mês: dia 1 00:00 até o último dia 23:59, inclusive fevereiro e virada de ano
assert.deepEqual(periodoDoMes(dayjs("2026-02-10T08:00")), {
  inicio: "2026-02-01T00:00",
  fim: "2026-02-28T23:59",
});
assert.deepEqual(periodoDoMes(dayjs("2024-02-10")).fim, "2024-02-29T23:59");
assert.deepEqual(periodoDoMes(dayjs("2026-12-31T23:59")), {
  inicio: "2026-12-01T00:00",
  fim: "2026-12-31T23:59",
});

// data local para os campos e para exibir
assert.equal(dataHoraLocal("2026-11-16T14:05:00"), "2026-11-16T14:05");
assert.match(dataHoraLocal(), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
assert.equal(formatarDataHora("2026-11-16T14:05:00"), "16/11/2026 14:05");

// iniciais: primeira e última palavra; espaços extras não quebram
assert.equal(iniciais("Conta Nubank Pessoal"), "CP");
assert.equal(iniciais("  erick  "), "E");
assert.equal(iniciais(""), "");

assert.equal(nomePermissao(0), "Mestre");
assert.equal(nomePermissao(1), "Administrador");
assert.equal(nomePermissao(2), "Visualizador");
assert.deepEqual(
  OPCOES_PERMISSAO.map((o) => o.valor),
  ["1", "2", "0"],
);

// nome repetido de categoria: ignora espaços nas pontas, maiúsculas e acentos
assert.equal(normalizarNome("  Alimentação "), normalizarNome("alimentacao"));
assert.notEqual(normalizarNome("Mercado"), normalizarNome("Mercados"));

console.log("formatacao: ok");
