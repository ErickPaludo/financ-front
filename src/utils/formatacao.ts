import dayjs, { type Dayjs } from "dayjs";

const moedaBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// sem valor (dados ainda não carregados) mostra R$ 0,00
export const formatarMoeda = (valor = 0) => moedaBRL.format(valor);

// Valor em R$ para exibir na tela; com os valores ocultos (botão de olho) mostra só a máscara.
export const exibirMoeda = (valor: number, oculto: boolean) =>
  oculto ? "R$ ••••" : formatarMoeda(valor);

// Sinal além da cor (acessibilidade): "+R$ 105,00" / "−R$ 145,00" (sinal de menos tipográfico).
export const valorComSinal = (valor: number, oculto = false) =>
  oculto ? "R$ ••••" : `${valor < 0 ? "−" : "+"}${formatarMoeda(Math.abs(valor))}`;

// Data e hora local no formato do <input type="datetime-local">, usado pelos campos de data (dayjs.format).
export const FORMATO_DATA_HORA = "YYYY-MM-DDTHH:mm";

// Data (ISO da API ou Date) no horário local, em FORMATO_DATA_HORA; sem data, agora.
export const dataHoraLocal = (data?: string | Date | Dayjs) =>
  dayjs(data).format(FORMATO_DATA_HORA);

// Válida e com o ano de 4 dígitos: digitando o ano, o campo passa por 0002, 0020, 0202.
export const ehDataCompleta = (data: Dayjs | null): data is Dayjs =>
  Boolean(data?.isValid()) && data!.year() >= 1000;

// FORMATO_DATA_HORA (horário local) -> ISO em UTC, como a API espera.
export const paraIsoUtc = (data: string) => new Date(data).toISOString();

// A data repetida mês a mês (FORMATO_DATA_HORA): 31/01 vezes 3 = 31/01, 28/02, 31/03.
// Soma a partir da original, para o dia 31 não virar 28 nos meses seguintes.
export const datasMensais = (data: string, vezes: number) =>
  Array.from({ length: vezes }, (_, i) =>
    dataHoraLocal(dayjs(data).add(i, "month")),
  );

// Mês inteiro da data: dia 1 às 00:00 até o último dia às 23:59.
export const periodoDoMes = (data: Dayjs = dayjs()) => ({
  inicio: dataHoraLocal(data.startOf("month")),
  fim: dataHoraLocal(data.endOf("month")),
});

// "16/11/2026" no horário local
export const formatarData = (data: string) => dayjs(data).format("DD/MM/YYYY");

// "16/11/2026 14:05" no horário local
export const formatarDataHora = (data: string) =>
  dayjs(data).format("DD/MM/YYYY HH:mm");

// "Conta Nubank Pessoal" -> "CP"; uma palavra só -> a primeira letra
export const iniciais = (nome: string) => {
  const palavras = nome.trim().split(/\s+/);
  return (
    (palavras[0]?.[0] ?? "") +
    (palavras.length > 1 ? palavras[palavras.length - 1][0] : "")
  ).toUpperCase();
};

// Para comparar e pesquisar nomes: sem espaços nas pontas, maiúsculas nem acentos
// ("  Alimentação" e "alimentacao" ficam iguais).
export const normalizarNome = (texto: string) =>
  texto
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
