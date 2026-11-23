// Rode com: node --experimental-strip-types scripts/testa-importacao-csv.ts
import assert from "node:assert/strict";
import {
  lerArquivos,
  lerData,
  lerTabela,
  lerValor,
  type Tabela,
} from "../src/services/movimentacoes/importacao/leitorCsv.ts";
import { sugerirMapa } from "../src/services/movimentacoes/importacao/mapeamentoColunas.ts";
import {
  converterTabela as converter,
  montarMovimentacao,
} from "../src/services/movimentacoes/importacao/conversaoMovimentacoes.ts";

const tabela = (texto: string) => {
  const t = lerTabela(texto);
  assert.ok(!("erro" in t), "erro" in t ? t.erro : "");
  return t as Tabela;
};

// valores: os dois formatos do Nubank, R$ e vazio
assert.equal(lerValor("-84.62"), -84.62);
assert.equal(lerValor("9.00"), 9);
assert.equal(lerValor("- 1.056,97"), -1056.97);
assert.equal(lerValor("R$ 29,55"), 29.55);
assert.ok(Number.isNaN(lerValor("")));
assert.ok(Number.isNaN(lerValor("abc")));

// datas: ISO e brasileira, com hora depois; dia que não existe é inválido
assert.equal(lerData("2024-01-03"), "2024-01-03");
assert.equal(lerData("05/01/2025"), "2025-01-05");
assert.equal(lerData("05/01/2025 10:30"), "2025-01-05");
assert.equal(lerData("31/02/2025"), null);
assert.equal(lerData("2025/01/05"), null);

// Nubank cartão: date,title,amount; sugestão certa, reembolso vira receita, pagamentos ignorados
const cartao = tabela(
  [
    "date,title,amount",
    "2024-01-03,Google Tinder,9.00",
    '2026-03-06,Pagamento recebido,"- 831,47"',
    "2025-09-08,Estorno de pagamento,-0.01",
    '2025-07-29,"Estorno de ""Mercadopago *Villages""",-39.51',
    "2025-02-13,Crédito de parcelamento de compra,-225.00",
    "2025-02-14,Zerada,0",
  ].join("\r\n"),
);
const mapaCartao = sugerirMapa(cartao.colunas);
assert.deepEqual(mapaCartao, { titulo: 1, valor: 2, data: 0, descricao: null });
const lidoCartao = converter(cartao, mapaCartao, "credito");
assert.ok("linhas" in lidoCartao);
assert.equal(lidoCartao.ignoradas, 3);
assert.deepEqual(
  lidoCartao.linhas.map((l) => [l.data, l.titulo, l.valor, l.receita]),
  [
    ["2024-01-03", "Google Tinder", 9, false],
    ["2025-07-29", 'Estorno de "Mercadopago *Villages"', 39.51, true],
    ["2025-02-13", "Crédito de parcelamento de compra", 225, true],
  ],
);

// Nubank conta: Data,Valor,Identificador,Descrição; negativo é despesa, e "Pagamento recebido" não é ignorado
const conta = tabela(
  [
    "Data,Valor,Identificador,Descrição",
    "01/02/2026,-7.59,697f91b5,Compra no débito - ZAFFARI S.PLGRINO",
    "05/01/2025,6500.00,01f04ad7,Transferência recebida pelo Pix - EMPRESA",
    "06/01/2025,10.00,01f04ad8,Pagamento recebido",
  ].join("\n"),
);
const mapaConta = sugerirMapa(conta.colunas);
assert.deepEqual(mapaConta, { titulo: 3, valor: 1, data: 0, descricao: null });
const lidoConta = converter(conta, { ...mapaConta, descricao: 2 }, "debito");
assert.ok("linhas" in lidoConta);
assert.equal(lidoConta.ignoradas, 0);
assert.deepEqual(lidoConta.linhas[0], {
  data: "2026-02-01",
  titulo: "Compra no débito - ZAFFARI S.PLGRINO",
  descricao: "697f91b5",
  valor: 7.59,
  receita: false,
});
assert.equal(lidoConta.linhas[1].receita, true);

// título e descrição longos são cortados em 80 caracteres
const longa = converter(
  tabela(
    `date,title,amount,obs\n2024-01-03,${"t".repeat(120)},1,${"x".repeat(100)}`,
  ),
  { titulo: 1, valor: 2, data: 0, descricao: 3 },
  "credito",
);
assert.ok("linhas" in longa);
assert.equal(longa.linhas[0].descricao.length, 80);
assert.equal(longa.linhas[0].titulo.length, 80);
// título curto: a API recusa, então barra já na leitura
assert.ok(
  "erro" in
    converter(
      tabela("date,title,amount\n2024-01-03,ab,1"),
      mapaCartao,
      "credito",
    ),
);

// a coluna salva vale pelo nome, mesmo em outra posição; a que sumiu cai na sugestão
assert.deepEqual(
  sugerirMapa(["Descrição", "Data", "Valor", "Obs"], {
    titulo: "Descrição",
    descricao: "Obs",
    data: "Sumiu",
  }),
  { titulo: 0, valor: 2, data: 1, descricao: 3 },
);

// ";" do Excel em português, campo entre aspas com o separador, BOM
const excel = tabela(
  String.fromCharCode(0xfeff) +
    'Data;Histórico;Valor\n03/01/2024;"Loja; ""X""";-10,50\n\n',
);
assert.deepEqual(excel.colunas, ["Data", "Histórico", "Valor"]);
assert.equal(excel.linhas.length, 1);
const lidoExcel = converter(excel, sugerirMapa(excel.colunas), "debito");
assert.ok("linhas" in lidoExcel);
assert.equal(lidoExcel.linhas[0].titulo, 'Loja; "X"');
assert.equal(lidoExcel.linhas[0].valor, 10.5);

// erros: sem cabeçalho de colunas, coluna obrigatória sem escolha, linha ilegível (com o número)
assert.ok("erro" in lerTabela("só uma coluna\nx"));
assert.ok(
  "erro" in converter(cartao, { ...mapaCartao, data: null }, "credito"),
);
const ruim = converter(
  tabela("date,title,amount\n2024-01-03,abc,1\n03-01-2024,bcd,1"),
  { titulo: 1, valor: 2, data: 0, descricao: null },
  "credito",
);
assert.deepEqual(ruim, { erro: 'Linha 3: data "03-01-2024" inválida.' });
assert.ok(
  "erro" in
    converter(
      tabela("date,title,amount\n2024-01-03,abc,abc"),
      mapaCartao,
      "credito",
    ),
);

// vários arquivos: mesmas colunas; um inválido ou cabeçalho diferente barra todos
const arquivos = lerArquivos([
  { nome: "jan.csv", texto: "date,title,amount\n2024-01-03,Padaria,9.00" },
  { nome: "fev.csv", texto: "date,title,amount\n2024-02-03,Mercado,20.00" },
]);
assert.ok(!("erro" in arquivos));
assert.deepEqual(arquivos.colunas, ["date", "title", "amount"]);
assert.equal(arquivos.partes.length, 2);
assert.deepEqual(
  lerArquivos([
    { nome: "a.csv", texto: "date,title,amount" },
    { nome: "b.csv", texto: "Data;Valor" },
  ]),
  {
    erro: "Os arquivos têm colunas diferentes. Importe um tipo de arquivo por vez.",
  },
);
const invalido = lerArquivos([{ nome: "x.csv", texto: "sozinha" }]);
assert.ok("erro" in invalido && invalido.erro.startsWith("x.csv: "));

// corpo do POST: extrato na data da linha; fatura na data escolhida, com a da compra na observação
const linha = {
  data: "2024-01-03",
  titulo: "Padaria",
  descricao: "pão",
  valor: 9,
  receita: false,
};
const extrato = montarMovimentacao(linha, {
  tipo: "debito",
  dataFatura: "2024-02-10T00:00",
  idsCategoria: [4],
});
assert.equal(extrato.tipo, 1); // despesa
assert.equal(extrato.concluido, false);
assert.equal(extrato.observacao, "Importado de CSV · pão");
assert.equal(extrato.dthrMovimentacao, new Date(2024, 0, 3).toISOString());
assert.deepEqual(extrato.idsCategoria, [4]);
const fatura = montarMovimentacao(
  { ...linha, descricao: "", receita: true },
  { tipo: "credito", dataFatura: "2024-02-10T00:00", idsCategoria: [] },
);
assert.equal(fatura.tipo, 0); // receita (reembolso)
assert.equal(fatura.observacao, "Importado de CSV · compra em 03/01/2024");
assert.equal(fatura.dthrMovimentacao, new Date(2024, 1, 10).toISOString());

console.log("importacao: ok");
