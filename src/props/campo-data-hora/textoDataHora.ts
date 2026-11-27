import dayjs from "dayjs";

// Texto do CampoDataHora: máscara de posições fixas "dd/mm/aaaa hh:mm", com "_" no que falta.
// Cada dígito tem o seu lugar: selecionar o ano e digitar troca só o ano (com a máscara que só
// juntava os dígitos, apagar o ano puxava a hora para o lugar dele; relato do usuário).
// Lógica pura, testada por scripts/testa-campo-data-hora.ts.

export const VAZIO = "__/__/____ __:__";
const VAGAS = [0, 1, 3, 4, 6, 7, 8, 9, 11, 12, 14, 15]; // posições dos dígitos

const trocar = (texto: string, pos: number, c: string) =>
  texto.slice(0, pos) + c + texto.slice(pos + 1);
const limpar = (texto: string, inicio: number, fim: number) =>
  VAGAS.filter((p) => p >= inicio && p < fim).reduce((t, p) => trocar(t, p, "_"), texto);
// cursor não fica parado antes de uma barra/espaço/dois-pontos
const pularSeparador = (pos: number) => VAGAS.find((p) => p >= pos) ?? VAZIO.length;

export type Edicao =
  | { tipo: "inserir"; dados: string }
  | { tipo: "apagar"; paraTras: boolean };

// Aplica a edição na seleção [inicio, fim) e devolve o texto e onde fica o cursor.
export function editarDataHora(
  texto: string,
  inicio: number,
  fim: number,
  edicao: Edicao,
) {
  if (edicao.tipo === "apagar") {
    if (inicio !== fim) return { texto: limpar(texto, inicio, fim), cursor: inicio };
    const vaga = edicao.paraTras
      ? VAGAS.findLast((p) => p < inicio)
      : VAGAS.find((p) => p >= inicio);
    if (vaga === undefined) return { texto, cursor: inicio };
    return { texto: trocar(texto, vaga, "_"), cursor: edicao.paraTras ? vaga : vaga + 1 };
  }
  const digitos = edicao.dados.replace(/\D/g, "");
  if (!digitos) return { texto, cursor: inicio };
  let novo = limpar(texto, inicio, fim);
  let pos = inicio;
  for (const d of digitos) {
    const vaga = VAGAS.find((p) => p >= pos);
    if (vaga === undefined) break;
    novo = trocar(novo, vaga, d);
    pos = vaga + 1;
  }
  return { texto: novo, cursor: pularSeparador(pos) };
}

// Qualquer texto (colado, preenchido pelo navegador) -> máscara, dígitos na ordem.
export const mascararDataHora = (texto: string) =>
  editarDataHora(VAZIO, 0, 0, { tipo: "inserir", dados: texto }).texto;

export const textoDaData = (valor: string) =>
  dayjs(valor).isValid() ? dayjs(valor).format("DD/MM/YYYY HH:mm") : VAZIO;

// Data completa e que existe (31/02 não). Hora em branco: usa `horaPadrao` ("HH:mm").
// Faltando algo, ou inválida: null.
export function lerDataHora(texto: string, horaPadrao = "00:00") {
  const [dia, mes, ano] = texto.slice(0, 10).split("/");
  const horaTexto = texto.slice(11);
  if (`${dia}${mes}${ano}`.includes("_")) return null;
  if (horaTexto.includes("_") && horaTexto !== "__:__") return null;
  const hora = horaTexto === "__:__" ? horaPadrao : horaTexto;
  const valor = `${ano}-${mes}-${dia}T${hora}`;
  // dayjs aceita 31/02 virando 03/03: só vale se formatar de volta igual
  const data = dayjs(valor);
  if (!data.isValid() || data.format("YYYY-MM-DDTHH:mm") !== valor) return null;
  return data.year() >= 1000 ? valor : null;
}

// Completo o bastante para valer ou mostrar erro (data inteira; hora inteira ou em branco).
export const estaCompleto = (texto: string) =>
  !texto.slice(0, 10).includes("_") &&
  (!texto.slice(11).includes("_") || texto.slice(11) === "__:__");
