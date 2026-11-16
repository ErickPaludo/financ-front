export type Resumo = {
  saldoReal: number;
  saldoRealProjetado: number;
  saldoRealizado: number;
  saldoProjetado: number;
  entrada: {
    concluidos: number;
    pendentes: number;
    projetado: number;
  };
  saida: {
    concluidos: number;
    pendentes: number;
    projetado: number;
  };
};

export type UsuarioCriador = {
  idContaUsuario: number;
  idUsuario: string;
  email: string;
  primeiroNome: string;
  segundoNome: string;
  nomeCompleto: string;
};

import type { Categoria } from "../categorias/Categorias";

export type { Categoria };

// tipo da movimentação como vem da API
export const TIPO_MOVIMENTACAO = { Receita: 0, Despesa: 1 } as const;

export type Movimentacao = {
  id: number;
  tipo: number; // TIPO_MOVIMENTACAO
  idConta: number;
  idFixo: number;
  concluido: boolean;
  valor: number;
  titulo: string;
  observacao: string | null;
  dthrReg: string;
  dthrMovimentacao: string;
  dthrConclusao: string | null;
  usarioCriador: UsuarioCriador;
  usuarioExecutor: UsuarioCriador | null; // assumindo padrão
  categorias: Categoria[];
};

export type ConteudoMovimentacoes = {
  resumo: Resumo;
  movimentacaos: Movimentacao[];
};

export type GetMovimentacoes = {
  conteudo: ConteudoMovimentacoes;
  metadados: unknown;
};

