import { useEffect, useMemo, useState } from "react";

import Conecta from "../../services/api/apiConnect";
import type {
  GetMovimentacoes,
  Movimentacao,
} from "../../models/movimentacoes/GetMovimentacoes";
import {
  rotaMovimentacoes,
  type FiltrosMovimentacao,
} from "../movimentacoes/filtrosUrl";
import {
  limitesDosPontos,
  repetirSaldoAnterior,
  saldosDiarios,
  saldosSemEscondidas,
} from "./agrupamento";

type Mensais = { rota: string; saldos: (number | null)[]; erro: string | null };

// Por mês, o saldo de cada mês menos o último: uma requisição por vez (a API é pesada), só os
// mesmos filtros com o período cortado no mês. O último é o da requisição normal.
async function buscarMensais(
  idConta: number,
  filtros: FiltrosMovimentacao,
  pontos: { inicio: string; fim: string }[],
  cancelado: () => boolean,
) {
  const saldos: (number | null)[] = [];
  for (const ponto of pontos) {
    if (cancelado()) break;
    const resposta = await Conecta<GetMovimentacoes>(
      rotaMovimentacoes(idConta, { ...filtros, ...ponto }),
      "GET",
    );
    // 404 = mês sem movimentação: sem saldo, repete o anterior
    if (!resposta.sucesso && resposta.status !== 404)
      return {
        saldos,
        erro: resposta.erro ?? "Não foi possível carregar o saldo.",
      };
    saldos.push(resposta.dados?.conteudo.resumo.saldoRealProjetado ?? null);
  }
  return { saldos, erro: null };
}

// Saldo da conta ao fim de cada ponto do gráfico "Entradas e saídas" (só com a opção ligada).
// Por dia: sai da requisição normal, voltando a partir do saldo final, sem chamadas a mais.
// Por mês: uma requisição por mês (pedido do usuário), menos o último.
export function useSaldosNoPeriodo(
  idConta: number,
  filtros: FiltrosMovimentacao,
  ativo: boolean,
  dados: GetMovimentacoes | undefined,
  escondidas: Movimentacao[], // as que "Ignorar categorias" tirou inteiras
  recargas = 0, // muda no botão Recarregar: busca os meses de novo
) {
  const { porMes, pontos } = useMemo(
    () => limitesDosPontos(filtros.inicio, filtros.fim),
    [filtros.inicio, filtros.fim],
  );
  const rota = rotaMovimentacoes(idConta, filtros);
  const [mensais, setMensais] = useState<Mensais>();

  useEffect(() => {
    if (!ativo || !porMes) return;
    let cancelado = false;
    buscarMensais(idConta, filtros, pontos.slice(0, -1), () => cancelado).then(
      (resultado) => {
        if (!cancelado) setMensais({ rota, ...resultado });
      },
    );
    return () => {
      cancelado = true;
    };
  }, [ativo, porMes, idConta, filtros, pontos, rota, recargas]);

  if (!ativo || !dados) return { saldos: null, carregando: false, erro: null };
  const saldoFinal = dados.conteudo.resumo.saldoRealProjetado;
  const fins = pontos.map((p) => p.fim);
  let saldos: (number | null)[];
  if (porMes) {
    // resposta de outro período (ou ainda buscando): não mistura
    if (mensais?.rota !== rota)
      return { saldos: null, carregando: true, erro: null };
    if (mensais.erro)
      return { saldos: null, carregando: false, erro: mensais.erro };
    saldos = repetirSaldoAnterior([...mensais.saldos, saldoFinal]);
  } else {
    saldos = saldosDiarios(fins, saldoFinal, dados.conteudo.movimentacaos);
  }
  return {
    saldos: saldosSemEscondidas(fins, saldos, escondidas),
    carregando: false,
    erro: null,
  };
}
