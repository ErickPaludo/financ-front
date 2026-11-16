export type Ordenacao = { chave: string; direcao: "asc" | "desc" } | null;

export type PreferenciasTabela = {
  ordem: string[]; // chaves das colunas na ordem exibida
  ocultas: string[];
  ordenacao: Ordenacao;
};

const lista = (valor: unknown): string[] =>
  Array.isArray(valor) ? valor.filter((v) => typeof v === "string") : [];

// Ajusta o que veio do localStorage às colunas atuais: ignora colunas que não existem
// mais, põe as novas no fim e nunca deixa todas ocultas. Sem nada salvo, usa o padrão da tela.
export const normalizarPreferencias = (
  salvas: unknown,
  chaves: string[],
  padrao?: Partial<PreferenciasTabela>,
): PreferenciasTabela => {
  const s = (salvas ?? padrao ?? {}) as Record<string, unknown>;
  const ordemSalva = lista(s.ordem).filter((c) => chaves.includes(c));
  const ordem = [
    ...ordemSalva,
    ...chaves.filter((c) => !ordemSalva.includes(c)),
  ];
  const ocultas = lista(s.ocultas).filter((c) => chaves.includes(c));
  const o = s.ordenacao as Ordenacao | undefined;
  const ordenacao =
    o &&
    chaves.includes(o.chave) &&
    (o.direcao === "asc" || o.direcao === "desc")
      ? { chave: o.chave, direcao: o.direcao }
      : null;
  return {
    ordem,
    ocultas: ocultas.length >= chaves.length ? [] : ocultas,
    ordenacao,
  };
};

export const moverItem = <T>(itens: T[], de: number, para: number): T[] => {
  if (de === para || para < 0 || para >= itens.length) return itens;
  const copia = [...itens];
  const [item] = copia.splice(de, 1);
  copia.splice(para, 0, item);
  return copia;
};

const vazio = (v: unknown) => v === null || v === undefined || v === "";

const comparar = (a: unknown, b: unknown) => {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean")
    return Number(a) - Number(b);
  return String(a).localeCompare(String(b), "pt-BR", {
    numeric: true,
    sensitivity: "base",
  });
};

// Valores vazios ficam sempre no fim, nas duas direções.
export const ordenarLinhas = <T>(
  linhas: T[],
  valor: (linha: T) => unknown,
  direcao: "asc" | "desc",
): T[] =>
  [...linhas].sort((x, y) => {
    const a = valor(x);
    const b = valor(y);
    if (vazio(a) || vazio(b)) return Number(vazio(a)) - Number(vazio(b));
    return direcao === "asc" ? comparar(a, b) : comparar(b, a);
  });

const chaveStorage = (id: string) => `tabela:${id}`;

export const lerPreferencias = (
  id: string,
  chaves: string[],
  padrao?: Partial<PreferenciasTabela>,
) => {
  try {
    const bruto = localStorage.getItem(chaveStorage(id));
    return normalizarPreferencias(
      bruto ? JSON.parse(bruto) : null,
      chaves,
      padrao,
    );
  } catch {
    return normalizarPreferencias(null, chaves, padrao);
  }
};

// devolve false quando o navegador bloqueia o localStorage (ex.: aba anônima)
export const salvarPreferencias = (id: string, p: PreferenciasTabela) => {
  try {
    localStorage.setItem(chaveStorage(id), JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
};
