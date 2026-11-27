// "Alterar categorias" em massa: como as categorias escolhidas mudam as atuais de cada movimentação.
export type ModoCategorias = "adicionar" | "remover" | "substituir";

export const OPCOES_MODO_CATEGORIAS: { rotulo: string; valor: ModoCategorias }[] = [
  { rotulo: "Adicionar às atuais", valor: "adicionar" },
  { rotulo: "Remover das atuais", valor: "remover" },
  { rotulo: "Substituir as atuais", valor: "substituir" },
];

// ids que a movimentação fica tendo; as atuais mantêm a ordem
export const categoriasResultantes = (
  atuais: number[],
  escolhidas: number[],
  modo: ModoCategorias,
) =>
  modo === "substituir"
    ? escolhidas
    : modo === "remover"
      ? atuais.filter((id) => !escolhidas.includes(id))
      : [...atuais, ...escolhidas.filter((id) => !atuais.includes(id))];
