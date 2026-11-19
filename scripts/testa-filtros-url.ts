// Rode com: node --experimental-strip-types scripts/testa-filtros-url.ts
import assert from "node:assert/strict";
import {
  parametrosApi,
  lerFiltros,
  paraParametros,
  passaNosFiltros,
} from "../src/telas/movimentacoes/filtrosUrl.ts";
import type { Movimentacao } from "../src/models/movimentacoes/GetMovimentacoes.tsx";

const padrao = { inicio: "2026-11-01T00:00", fim: "2026-11-30T23:59" };
const ler = (url: string) => lerFiltros(new URLSearchParams(url), padrao);

// sem parâmetros: mês atual e sem filtros
assert.deepEqual(ler(""), {
  ...padrao,
  categorias: [],
  status: "todas",
  tipo: "todas",
});

// valores válidos são lidos
assert.deepEqual(
  ler("inicio=2026-10-01T00:00&fim=2026-10-31T23:59&categorias=0,5,12&status=pendente&tipo=saida"),
  {
    inicio: "2026-10-01T00:00",
    fim: "2026-10-31T23:59",
    categorias: [0, 5, 12],
    status: "pendente",
    tipo: "saida",
  },
);

// URL editada à mão: o que é inválido volta ao padrão, categorias repetidas ou não numéricas somem
assert.deepEqual(
  ler("inicio=ontem&fim=2026-13-45T99:99&categorias=3,x,-1,3,&status=TUDO&tipo=1"),
  { ...padrao, categorias: [3], status: "todas", tipo: "todas" },
);

// escrita: padrão fica fora da URL; ida e volta preserva os filtros
assert.equal(paraParametros(ler(""), padrao).toString(), "");
const filtros = ler("inicio=2026-10-01T00:00&categorias=2,7&tipo=entrada");
assert.equal(
  paraParametros(filtros, padrao).toString(),
  "inicio=2026-10-01T00%3A00&categorias=2%2C7&tipo=entrada",
);
assert.deepEqual(
  lerFiltros(paraParametros(filtros, padrao), padrao),
  filtros,
);

// recém-cadastrada entra na tabela só se passar nos filtros
const mov = {
  dthrMovimentacao: "2026-11-16T14:30:00",
  tipo: 1, // despesa
  concluido: false,
  categorias: [{ idCategoria: 5, nome: "Mercado", cor: "#fff" }],
} as unknown as Movimentacao;
const semFiltro = ler("");
assert.equal(passaNosFiltros(mov, semFiltro), true);
assert.equal(passaNosFiltros({ ...mov, dthrMovimentacao: "2026-12-01T00:00:00" }, semFiltro), false);
assert.equal(passaNosFiltros({ ...mov, dthrMovimentacao: "2026-11-30T23:59:30" }, semFiltro), true);
assert.equal(passaNosFiltros(mov, { ...semFiltro, tipo: "entrada" }), false);
assert.equal(passaNosFiltros(mov, { ...semFiltro, tipo: "saida" }), true);
assert.equal(passaNosFiltros(mov, { ...semFiltro, status: "concluido" }), false);
assert.equal(passaNosFiltros(mov, { ...semFiltro, categorias: [5, 9] }), true);
assert.equal(passaNosFiltros(mov, { ...semFiltro, categorias: [9] }), false);
const semCategoria = { ...mov, categorias: [] };
assert.equal(passaNosFiltros(semCategoria, { ...semFiltro, categorias: [0] }), true);
assert.equal(passaNosFiltros(semCategoria, { ...semFiltro, categorias: [5] }), false);

// query da API (transações e dashboard): status, tipo e categorias só quando filtrados
const api = parametrosApi({ inicio: "2026-11-01T00:00", fim: "2026-11-30T23:59", categorias: [1, 0], status: "pendente", tipo: "saida" });
assert.deepEqual(api.getAll("IdCategoria"), ["1", "0"]);
assert.equal(api.get("Concluido"), "false");
assert.equal(api.get("TipoMovimentacao"), "1");
assert.equal(api.get("RetornaFixos"), "true");
// UTC de verdade (como o cadastro grava), não o horário local com "Z"
assert.equal(api.get("DthrMovimentacaoInicial"), new Date("2026-11-01T00:00").toISOString());
assert.equal(api.get("DthrMovimentacaoFinal"), new Date("2026-11-30T23:59").toISOString());
const apiSemFiltro = parametrosApi({ inicio: "2026-11-01T00:00", fim: "2026-11-30T23:59", categorias: [], status: "todas", tipo: "todas" });
assert.equal(apiSemFiltro.has("Concluido") || apiSemFiltro.has("TipoMovimentacao") || apiSemFiltro.has("IdCategoria"), false);

console.log("filtros-url: ok");

// período acima de 100 anos editado na URL volta ao padrão; exatamente 100 anos vale
assert.deepEqual(
  (({ inicio, fim }) => ({ inicio, fim }))(
    ler("inicio=1900-01-01T00:00&fim=2026-11-30T23:59"),
  ),
  padrao,
);
assert.equal(ler("inicio=1950-01-01T00:00&fim=2050-01-01T00:00").inicio, "1950-01-01T00:00");
// data além de 100 anos de hoje também volta ao padrão
assert.equal(ler("inicio=2100-01-01T00:00&fim=2190-01-01T00:00").inicio, padrao.inicio);
console.log("período máximo ok");
