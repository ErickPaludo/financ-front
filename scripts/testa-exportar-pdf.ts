// Rode com: node --experimental-strip-types scripts/testa-exportar-pdf.ts
import assert from "node:assert/strict";
import { conteudoRelatorio } from "../src/services/movimentacoes/exportacao/exportacaoPdf.ts";
import { nomeArquivo } from "../src/services/movimentacoes/exportacao/colunasExportacao.ts";

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
  valor: 50,
  titulo: "Mercado",
  categorias: [{ idCategoria: 1, nome: "Mercado & Cia", cor: "#000" }],
  concluido: true,
  dthrMovimentacao: "2026-11-03T14:05:00",
  observacao: null,
  dthrConclusao: null,
  usarioCriador: usuario("a@b.com"),
  usuarioExecutor: null,
  idFixo: 0,
};

const dados = {
  conta: "Casa/Pessoal",
  inicio: "2026-11-01T00:00",
  fim: "2026-11-30T23:59",
  movimentacoes: [mov, { ...mov, tipo: 0, valor: 80, titulo: "Salário" }],
};
const c = conteudoRelatorio(dados);

assert.equal(c.conta, "Casa/Pessoal");
assert.equal(c.periodo, "Transações de 01/11/2026 a 30/11/2026");
// todas as colunas da tabela, na ordem
assert.deepEqual(c.cabecalho, [
  "Título",
  "Valor",
  "Categoria",
  "Status",
  "Data mov.",
  "Observação",
  "Data conclusão",
  "Usu. cad.",
  "Usu. exe.",
  "Agendada",
]);
// formatarMoeda usa espaço não separável: compara sem espaços
const semEspacos = (t: string) => t.replace(/\s/g, "");
// sinal de menos comum (a Helvetica do PDF não tem o tipográfico)
assert.equal(semEspacos(c.linhas[0][1]), "-R$50,00");
assert.equal(semEspacos(c.linhas[1][1]), "+R$80,00");
assert.equal(c.linhas[0][2], "Mercado & Cia");
assert.equal(
  semEspacos(c.totais),
  "2transações·EntradasR$80,00·SaídasR$50,00·Saldodoperíodo+R$30,00",
);
// "/" do nome da conta não vale em nome de arquivo
assert.equal(
  nomeArquivo(dados, "pdf"),
  "transacoes Casa-Pessoal 2026-11-01 a 2026-11-30.pdf",
);
assert.equal(
  nomeArquivo(dados, "csv"),
  "transacoes Casa-Pessoal 2026-11-01 a 2026-11-30.csv",
);

console.log("exportarPdf: ok");
