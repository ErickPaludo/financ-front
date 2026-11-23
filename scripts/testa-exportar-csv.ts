// Rode com: node --experimental-strip-types scripts/testa-exportar-csv.ts
import assert from "node:assert/strict";
import { gerarCsv as paraCsv } from "../src/services/movimentacoes/exportacao/exportacaoCsv.ts";
import {
  lerTabela,
  type Tabela,
} from "../src/services/movimentacoes/importacao/leitorCsv.ts";
import { sugerirMapa } from "../src/services/movimentacoes/importacao/mapeamentoColunas.ts";
import { converterTabela as converter } from "../src/services/movimentacoes/importacao/conversaoMovimentacoes.ts";

const usuario = (email: string) => ({
  idContaUsuario: 1,
  idUsuario: "u",
  email,
  primeiroNome: "",
  segundoNome: "",
  nomeCompleto: "",
});
const mov = {
  tipo: 1,
  valor: 1056.97,
  titulo: 'Mercado; "Centro"',
  categorias: [
    { idCategoria: 1, nome: "Mercado", cor: "#000" },
    { idCategoria: 2, nome: "Casa", cor: "#000" },
  ],
  concluido: true,
  dthrMovimentacao: "2026-11-03T14:05:00",
  observacao: "=HYPERLINK(1)",
  dthrConclusao: "2026-11-04T08:00:00",
  usarioCriador: usuario("a@b.com"),
  usuarioExecutor: null,
  idFixo: 0,
};

const linhas = paraCsv([
  mov,
  {
    ...mov,
    tipo: 0,
    valor: 10,
    titulo: "Salário",
    observacao: null,
    dthrConclusao: null,
    concluido: false,
    idFixo: 7,
    categorias: [],
  },
]).split("\r\n");
assert.equal(
  linhas[0],
  "Título;Valor;Categoria;Status;Data mov.;Observação;Data conclusão;Usu. cad.;Usu. exe.;Agendada",
);
// ; e aspas entre aspas, despesa negativa, fórmula neutralizada
assert.equal(
  linhas[1],
  '"Mercado; ""Centro""";-1056,97;Mercado, Casa;Concluído;03/11/2026 14:05;\'=HYPERLINK(1);04/11/2026 08:00;a@b.com;;Não',
);
assert.equal(
  linhas[2],
  "Salário;10,00;;Pendente;03/11/2026 14:05;;;a@b.com;;Sim",
);
assert.equal(paraCsv([]).split("\r\n").length, 1); // só o cabeçalho

// o arquivo exportado volta pelo Importar CSV como extrato da conta
const tabela = lerTabela(paraCsv([mov])) as Tabela;
const lido = converter(tabela, sugerirMapa(tabela.colunas), "debito");
assert.ok("linhas" in lido);
assert.deepEqual(
  { ...lido.linhas[0], descricao: undefined },
  {
    data: "2026-11-03",
    titulo: 'Mercado; "Centro"',
    descricao: undefined,
    valor: 1056.97,
    receita: false,
  },
);

console.log("exportarCsv: ok");
