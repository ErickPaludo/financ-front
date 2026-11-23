// Imports com extensão: os scripts de teste rodam estes arquivos direto no Node.
import dayjs from "dayjs";

import type { Movimentacao } from "../../../models/movimentacoes/GetMovimentacoes.ts";

export type LinhaExportada = Pick<
  Movimentacao,
  | "tipo"
  | "valor"
  | "titulo"
  | "categorias"
  | "concluido"
  | "dthrMovimentacao"
  | "observacao"
  | "dthrConclusao"
  | "usarioCriador"
  | "usuarioExecutor"
  | "idFixo"
>;

// o que a tela da conta exporta: as transações que estão nela, com o período dos filtros
export type DadosExportacao = {
  conta: string;
  inicio: string; // FORMATO_DATA_HORA
  fim: string;
  movimentacoes: LinhaExportada[];
};

const dataHora = (data: string | null) =>
  data ? dayjs(data).format("DD/MM/YYYY HH:mm") : "";

// As colunas da tabela da tela da conta, na mesma ordem, inclusive as escondidas por padrão
// (CSV e PDF). O valor vem com sinal (despesa negativa) e cada formato o escreve do seu jeito.
export const colunasExportacao = (
  valor: (comSinal: number) => string,
): [string, (mov: LinhaExportada) => string][] => [
  ["Título", (mov) => mov.titulo],
  ["Valor", (mov) => valor(mov.tipo === 0 ? mov.valor : -mov.valor)],
  ["Categoria", (mov) => mov.categorias.map((c) => c.nome).join(", ")],
  ["Status", (mov) => (mov.concluido ? "Concluído" : "Pendente")],
  ["Data mov.", (mov) => dataHora(mov.dthrMovimentacao)],
  ["Observação", (mov) => mov.observacao ?? ""],
  ["Data conclusão", (mov) => dataHora(mov.dthrConclusao)],
  ["Usu. cad.", (mov) => mov.usarioCriador?.email ?? ""],
  ["Usu. exe.", (mov) => mov.usuarioExecutor?.email ?? ""],
  ["Agendada", (mov) => (mov.idFixo ? "Sim" : "Não")],
];

// "transacoes Casa-Pessoal 2026-11-01 a 2026-11-30.pdf" ("/" e afins não valem em nome de arquivo)
export const nomeArquivo = (
  { conta, inicio, fim }: Omit<DadosExportacao, "movimentacoes">,
  extensao: "csv" | "pdf",
) =>
  `transacoes ${conta.replace(/[\\/:*?"<>|]/g, "-")} ${dayjs(inicio).format("YYYY-MM-DD")} a ${dayjs(fim).format("YYYY-MM-DD")}.${extensao}`;
