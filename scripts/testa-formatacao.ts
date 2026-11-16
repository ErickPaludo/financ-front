// Rode com: node --experimental-strip-types scripts/testa-formatacao.ts
import assert from "node:assert/strict";
import dayjs from "dayjs";
import {
  dataHoraLocal,
  formatarDataHora,
  formatarMoeda,
  iniciais,
  periodoDoMes,
  valorComSinal,
} from "../src/utils/formatacao.ts";
import { nomePermissao, OPCOES_PERMISSAO } from "../src/utils/permissao.ts";

// moeda: sem valor vira R$ 0,00 (o Intl usa espaço não separável)
const semEspacoEspecial = (texto: string) => texto.replace(/\s/g, " ");
assert.equal(semEspacoEspecial(formatarMoeda()), "R$ 0,00");
assert.equal(semEspacoEspecial(formatarMoeda(1234.5)), "R$ 1.234,50");
assert.equal(semEspacoEspecial(valorComSinal(-145)), "−R$ 145,00");

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

console.log("formatacao: ok");
