// Leitura de um CSV qualquer com cabeçalho e dos valores e datas das células.
// Imports com extensão: os scripts de teste rodam estes arquivos direto no Node.
import dayjs from "dayjs";

export type Tabela = {
  colunas: string[];
  linhas: { numero: number; campos: string[] }[]; // numero = linha no arquivo
};

// "-84.62", "- 1.056,97" (Nubank desde mar/2026), "R$ 10,00": vírgula decimal quando houver vírgula.
export const lerValor = (texto: string) => {
  const limpo = texto.replace(/\s|R\$/g, "");
  if (!limpo) return NaN;
  return Number(
    limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo,
  );
};

// "2024-01-03" ou "03/01/2024" (com ou sem hora depois) -> "2024-01-03"; inválida -> null
export const lerData = (texto: string) => {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto);
  const br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(texto);
  const data = iso
    ? `${iso[1]}-${iso[2]}-${iso[3]}`
    : br
      ? `${br[3]}-${br[2]}-${br[1]}`
      : null;
  // dayjs aceita 31/02 virando 03/03: só vale se a volta der a mesma data
  return data && dayjs(data).format("YYYY-MM-DD") === data ? data : null;
};

// Separa os campos de uma linha; campo entre aspas pode ter o separador ("" é aspas).
const campos = (linha: string, separador: string) => {
  const saida: string[] = [];
  let atual = "";
  let entreAspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (entreAspas) {
      if (c === '"' && linha[i + 1] === '"') atual += linha[++i];
      else if (c === '"') entreAspas = false;
      else atual += c;
    } else if (c === '"') entreAspas = true;
    else if (c === separador) {
      saida.push(atual);
      atual = "";
    } else atual += c;
  }
  saida.push(atual);
  return saida.map((campo) => campo.trim());
};

// Excel em português salva com ";" (a vírgula é decimal); decide pelo cabeçalho.
export const lerTabela = (texto: string): Tabela | { erro: string } => {
  const [cabecalho = "", ...resto] = texto.trim().split(/\r?\n/); // trim também tira o BOM
  const separador =
    cabecalho.split(";").length > cabecalho.split(",").length ? ";" : ",";
  const colunas = campos(cabecalho, separador);
  if (colunas.length < 2)
    return {
      erro: "Não parece um CSV: a primeira linha deve ter o nome das colunas, separados por vírgula ou ponto e vírgula.",
    };
  const linhas = resto.flatMap((bruta, i) =>
    bruta.trim() ? [{ numero: i + 2, campos: campos(bruta, separador) }] : [],
  );
  return { colunas, linhas };
};

export type ArquivoLido = {
  colunas: string[];
  partes: { nome: string; tabela: Tabela }[];
};

// Vários arquivos numa importação só. Um inválido barra todos (melhor corrigir a escolha do que
// importar só parte) e todos precisam das mesmas colunas (uma escolha de colunas para todos).
export const lerArquivos = (
  arquivos: { nome: string; texto: string }[],
): ArquivoLido | { erro: string } => {
  const lidos = arquivos.map(({ nome, texto }) => ({
    nome,
    tabela: lerTabela(texto),
  }));
  const erros = lidos.flatMap(({ nome, tabela }) =>
    "erro" in tabela ? [`${nome}: ${tabela.erro}`] : [],
  );
  if (erros.length) return { erro: erros.join("\n") };
  const partes = lidos as { nome: string; tabela: Tabela }[];
  const colunas = partes[0]?.tabela.colunas ?? [];
  if (partes.some(({ tabela }) => tabela.colunas.join() !== colunas.join()))
    return {
      erro: "Os arquivos têm colunas diferentes. Importe um tipo de arquivo por vez.",
    };
  return { colunas, partes };
};
