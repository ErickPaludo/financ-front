// Linhas do CSV -> movimentações a importar, conforme o tipo do arquivo.
import { TIPO_MOVIMENTACAO } from "../../../models/movimentacoes/GetMovimentacoes.ts";
import type { MovimentacaoPost } from "../../../models/movimentacoes/MovimentacaoPost.ts";
import { formatarData, paraIsoUtc } from "../../../utils/formatacao.ts";
import { lerData, lerValor, type Tabela } from "./leitorCsv.ts";
import type { Mapa } from "./mapeamentoColunas.ts";

// credito: fatura do cartão (positivo = gasto, sem o pagamento da fatura); debito: extrato da
// conta (negativo = gasto).
export type TipoArquivo = "credito" | "debito";

// valor sempre positivo; receita diz o tipo da movimentação
export type LinhaImportada = {
  data: string; // YYYY-MM-DD
  titulo: string;
  descricao: string;
  valor: number;
  receita: boolean;
};

// Fatura do cartão: pagamento da fatura não é gasto nem reembolso (o dinheiro sai da conta em outro lançamento).
const IGNORADOS = ["pagamento recebido", "estorno de pagamento"];

// Linhas da tabela pelo mapa. Qualquer linha ilegível barra tudo (provável coluna errada).
// Valor zero fica de fora; na fatura, os pagamentos também (IGNORADOS).
export const converterTabela = (
  tabela: Tabela,
  mapa: Mapa,
  tipo: TipoArquivo,
): { linhas: LinhaImportada[]; ignoradas: number } | { erro: string } => {
  const {
    titulo: iTitulo,
    valor: iValor,
    data: iData,
    descricao: iDesc,
  } = mapa;
  if (iTitulo === null || iValor === null || iData === null)
    return { erro: "Escolha as colunas de título, valor e data." };
  const linhas: LinhaImportada[] = [];
  let ignoradas = 0;
  for (const { numero, campos: c } of tabela.linhas) {
    const titulo = c[iTitulo] ?? "";
    const valor = lerValor(c[iValor] ?? "");
    const data = lerData(c[iData] ?? "");
    const problema = !data
      ? `data "${c[iData] ?? ""}" inválida`
      : Number.isNaN(valor)
        ? `valor "${c[iValor] ?? ""}" inválido`
        : titulo.length < 3
          ? `título "${titulo}" com menos de 3 caracteres (a API exige de 3 a 80)`
          : null;
    if (problema) return { erro: `Linha ${numero}: ${problema}.` };
    if (
      valor === 0 ||
      (tipo === "credito" && IGNORADOS.includes(titulo.toLowerCase()))
    ) {
      ignoradas++;
      continue;
    }
    linhas.push({
      data: data!,
      titulo: titulo.slice(0, 80), // a API aceita de 3 a 80 caracteres
      descricao: iDesc === null ? "" : (c[iDesc] ?? "").slice(0, 80), // pedido do usuário: no máximo 80
      valor: Math.abs(valor),
      // fatura: negativo é reembolso; extrato: positivo é entrada
      receita: tipo === "credito" ? valor < 0 : valor > 0,
    });
  }
  return { linhas, ignoradas };
};

type Conversao =
  { linhas: LinhaImportada[]; ignoradas: number } | { erro: string };

// Todos os arquivos com o mesmo mapa; o erro diz de qual arquivo é a linha (se houver mais de um).
export const converterArquivos = (
  partes: { nome: string; tabela: Tabela }[],
  mapa: Mapa,
  tipo: TipoArquivo,
): Conversao => {
  const linhas: LinhaImportada[] = [];
  let ignoradas = 0;
  for (const { nome, tabela } of partes) {
    const lido = converterTabela(tabela, mapa, tipo);
    if ("erro" in lido)
      return { erro: partes.length > 1 ? `${nome}: ${lido.erro}` : lido.erro };
    linhas.push(...lido.linhas);
    ignoradas += lido.ignoradas;
  }
  return { linhas, ignoradas };
};

export type OpcoesImportacao = {
  tipo: TipoArquivo;
  dataFatura: string; // FORMATO_DATA_HORA; só na fatura
  idsCategoria: number[];
};

// O corpo do POST de uma linha: sempre pendente (concluir depois pelas ações em massa). O extrato
// lança na data da linha; a fatura, todas na data da fatura, com a da compra na observação.
export const montarMovimentacao = (
  { data, titulo, descricao, valor, receita }: LinhaImportada,
  { tipo, dataFatura, idsCategoria }: OpcoesImportacao,
): MovimentacaoPost => {
  const fatura = tipo === "credito";
  return {
    tipo: receita ? TIPO_MOVIMENTACAO.Receita : TIPO_MOVIMENTACAO.Despesa,
    valor,
    concluido: false,
    titulo,
    // shortcut: corta em 255 sem saber o limite da API; ajuste se ela aceitar mais
    observacao: [
      "Importado de CSV",
      descricao,
      fatura && `compra em ${formatarData(data)}`,
    ]
      .filter(Boolean)
      .join(" · ")
      .slice(0, 255),
    dthrMovimentacao: paraIsoUtc(fatura ? dataFatura : `${data}T00:00`),
    dthrConclusao: null,
    idsCategoria,
  };
};
