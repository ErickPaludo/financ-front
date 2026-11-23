// Qual coluna do CSV é cada campo da movimentação (sugestão pelos nomes; Nubank cartão e
// conta já saem certos).
import { normalizarNome } from "../../../utils/formatacao.ts";

export type Campo = "titulo" | "valor" | "data" | "descricao";
export type Mapa = Record<Campo, number | null>; // índice da coluna; descrição é opcional

// nomes de coluna reconhecidos (sem acento e maiúscula); a primeira que bater é a sugestão
const SUGESTOES: Record<Exclude<Campo, "descricao">, string[]> = {
  titulo: [
    "title",
    "titulo",
    "descricao",
    "historico",
    "estabelecimento",
    "lancamento",
  ],
  valor: ["amount", "valor", "value"],
  data: ["date", "data", "data lancamento", "data da compra", "data mov."], // "data mov.": o Exportar CSV
};

// Sugestão de colunas: a salva da última importação (pelo nome), senão pelo nome conhecido.
export const sugerirMapa = (
  colunas: string[],
  salvo?: Partial<Record<Campo, string | null>>,
): Mapa => {
  const nomes = colunas.map(normalizarNome);
  const salva = (campo: Campo) => {
    const i = salvo?.[campo] ? colunas.indexOf(salvo[campo]) : -1;
    return i >= 0 ? i : null;
  };
  const conhecida = (campo: Exclude<Campo, "descricao">) => {
    const i = SUGESTOES[campo]
      .map((nome) => nomes.indexOf(nome))
      .find((i) => i >= 0);
    return i ?? null;
  };
  return {
    titulo: salva("titulo") ?? conhecida("titulo"),
    valor: salva("valor") ?? conhecida("valor"),
    data: salva("data") ?? conhecida("data"),
    descricao: salva("descricao"),
  };
};
