// Filtros da tela da conta guardados na URL (?inicio=&fim=&categorias=&status=&tipo=):
// recarregar ou compartilhar o link mantém a mesma visão. Valores padrão ficam fora da URL.
// com extensão: scripts/testa-filtros-url.ts roda este arquivo direto no Node
import {
  dataHoraLocal,
  paraIsoUtc,
  periodoDoMes,
} from "../../utils/formatacao.ts";
import type { Movimentacao } from "../../models/movimentacoes/GetMovimentacoes";
import { foraDosLimites, passaDoMaximo } from "./filtro-periodo/periodo.ts";

export const STATUS = ["todas", "pendente", "concluido"] as const;
export const TIPOS = ["todas", "entrada", "saida"] as const;

export const OPCOES_STATUS = [
  { rotulo: "Todas", valor: "todas" },
  { rotulo: "Pendente", valor: "pendente" },
  { rotulo: "Concluído", valor: "concluido" },
];
export const OPCOES_TIPO = [
  { rotulo: "Todas", valor: "todas" },
  { rotulo: "Entrada", valor: "entrada" },
  { rotulo: "Saída", valor: "saida" },
];

export type FiltrosMovimentacao = {
  inicio: string; // FORMATO_DATA_HORA
  fim: string;
  categorias: number[]; // 0 = "Sem categoria"
  status: (typeof STATUS)[number];
  tipo: (typeof TIPOS)[number];
};

type Periodo = { inicio: string; fim: string };

const FORMATO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// a URL pode ter sido editada à mão: valor inválido volta ao padrão.
// Formatar de novo e comparar barra datas que o dayjs "conserta" (mês 13 vira janeiro do ano seguinte).
const lerData = (valor: string | null, padrao: string) =>
  valor && FORMATO.test(valor) && dataHoraLocal(valor) === valor
    ? valor
    : padrao;

const lerOpcao = <T extends string>(
  valor: string | null,
  opcoes: readonly T[],
) => opcoes.find((opcao) => opcao === valor) ?? opcoes[0];

const lerCategorias = (valor: string | null) => [
  ...new Set(
    (valor ?? "")
      .split(",")
      .filter((id) => /^\d+$/.test(id))
      .map(Number),
  ),
];

export function lerFiltros(
  parametros: URLSearchParams,
  padrao: Periodo = periodoDoMes(),
): FiltrosMovimentacao {
  const periodo = {
    inicio: lerData(parametros.get("inicio"), padrao.inicio),
    fim: lerData(parametros.get("fim"), padrao.fim),
  };
  return {
    ...(passaDoMaximo(periodo) || foraDosLimites(periodo) ? padrao : periodo),
    categorias: lerCategorias(parametros.get("categorias")),
    status: lerOpcao(parametros.get("status"), STATUS),
    tipo: lerOpcao(parametros.get("tipo"), TIPOS),
  };
}

// A movimentação apareceria na tabela com estes filtros? (usado para incluir uma recém-cadastrada sem
// buscar de novo na API). Mesmas regras da busca: período, tipo, status e categorias (0 = sem categoria).
export function passaNosFiltros(
  mov: Movimentacao,
  filtros: FiltrosMovimentacao,
) {
  const data = dataHoraLocal(mov.dthrMovimentacao);
  if (data < filtros.inicio || data > filtros.fim) return false;
  if (
    filtros.tipo !== "todas" &&
    mov.tipo !== (filtros.tipo === "entrada" ? 0 : 1)
  )
    return false;
  if (
    filtros.status !== "todas" &&
    mov.concluido !== (filtros.status === "concluido")
  )
    return false;
  if (!filtros.categorias.length) return true;
  return mov.categorias.length
    ? mov.categorias.some((c) => filtros.categorias.includes(c.idCategoria))
    : filtros.categorias.includes(0);
}

export function paraParametros(
  filtros: FiltrosMovimentacao,
  padrao: Periodo = periodoDoMes(),
) {
  const parametros = new URLSearchParams();
  if (filtros.inicio !== padrao.inicio)
    parametros.set("inicio", filtros.inicio);
  if (filtros.fim !== padrao.fim) parametros.set("fim", filtros.fim);
  if (filtros.categorias.length)
    parametros.set("categorias", filtros.categorias.join(","));
  if (filtros.status !== STATUS[0]) parametros.set("status", filtros.status);
  if (filtros.tipo !== TIPOS[0]) parametros.set("tipo", filtros.tipo);
  return parametros;
}

// Filtros -> query da API de movimentações (/Contas/{id}/Movimentacoes/Retornar), com as agendadas.
// Datas em UTC de verdade, como o cadastro grava (paraIsoUtc): mandar o horário local com "Z"
// deslocava o período 3h (o mês 12 trazia a noite de 30/11 e perdia a de 31/12).
export function parametrosApi(filtros: FiltrosMovimentacao) {
  const parametros = new URLSearchParams({
    DthrMovimentacaoInicial: paraIsoUtc(filtros.inicio),
    DthrMovimentacaoFinal: paraIsoUtc(filtros.fim),
  });
  filtros.categorias.forEach((id) =>
    parametros.append("IdCategoria", String(id)),
  );
  if (filtros.status !== "todas")
    parametros.append("Concluido", String(filtros.status === "concluido"));
  if (filtros.tipo !== "todas")
    parametros.append(
      "TipoMovimentacao",
      filtros.tipo === "entrada" ? "0" : "1",
    );
  parametros.append("RetornaFixos", "true");
  return parametros;
}

// GET das movimentações com os filtros: o mesmo endereço na tela da conta e no dashboard,
// para os dois mostrarem exatamente os mesmos dados.
export const rotaMovimentacoes = (
  idConta: number,
  filtros: FiltrosMovimentacao,
) => `/Contas/${idConta}/Movimentacoes/Retornar?${parametrosApi(filtros)}`;
