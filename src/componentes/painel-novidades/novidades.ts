// Novidades exibidas no painel "Novidades" da barra lateral, da versão mais nova para a mais antiga.
// Versão nova: acrescente uma entrada no topo (a mesma do package.json).
export type Novidade = {
  versao: string;
  data: string; // dd/mm/aaaa
  grupos: { titulo: string; icone: string; itens: string[] }[];
};

export const NOVIDADES: Novidade[] = [
  {
    versao: "1.0.2-alpha",
    data: "22/11/2026",
    grupos: [
      {
        titulo: "Novidades",
        icone: "auto_awesome",
        itens: [
          "Funções experimentais: ligue em Opções de usuário › Experimental para testar o que ainda está em desenvolvimento.",
          "Importar CSV da fatura do cartão do Nubank (experimental): cada compra vira uma despesa na data da fatura e cada estorno vira uma receita. Aceita vários arquivos de uma vez, e o dia da virada e as categorias ficam salvos por conta.",
          "Alterar data em massa: selecione várias transações e mude a data de todas de uma vez.",
          "Setas na barra de filtros para ir ao mês anterior ou ao próximo sem abrir o painel.",
        ],
      },
      {
        titulo: "Correções",
        icone: "build",
        itens: [
          "Depois de cadastrar uma transação, os saldos e o resumo do período se atualizam na hora.",
          'No celular, segurar um card de conta para arrastar não abre mais o menu "Abrir em nova guia".',
        ],
      },
    ],
  },
  {
    versao: "1.0.1-alpha",
    data: "19/11/2026",
    grupos: [
      {
        titulo: "Novidades",
        icone: "auto_awesome",
        itens: [
          "Dashboard da conta: entradas e saídas no período e gráficos por categoria, com os mesmos filtros das transações.",
          "Ignore categorias no dashboard sem perder o resto da movimentação.",
          "Transferência entre contas: a saída e a entrada são lançadas de uma vez.",
          "Repetir nos meses seguintes: crie o mesmo lançamento por até 48 meses.",
          "Ações em massa: selecione várias transações e conclua, estorne ou exclua de uma vez.",
          "Botão de olho para esconder os valores na inicial, na conta e no dashboard.",
          "Modo claro, nova logo e visual renovado.",
        ],
      },
      {
        titulo: "Melhorias",
        icone: "trending_up",
        itens: [
          "Filtros em painel, com atalhos de período (este mês, mês passado, últimos 30 dias…) e busca por texto.",
          "Os filtros ficam no endereço: recarregue ou compartilhe o link sem perder a visão.",
          "Tabela configurável: ordene, esconda e reordene colunas, ou veja as transações em cards.",
          "Cards de conta e gráficos arrastáveis, na ordem que você preferir.",
          "Membros, convites e opções de usuário abrem ao lado do menu, sem sair da tela.",
          "Atalhos para a última conta acessada e para as favoritas no menu.",
          "Edite o nome e a cor da conta direto no card.",
        ],
      },
      {
        titulo: "Correções",
        icone: "build",
        itens: [
          "O filtro de período não desloca mais as transações em 3 horas.",
          "Recarregar a página mantém a tela e a conta abertas.",
          "Trocar o filtro rápido não mostra mais o resultado anterior.",
          "Itens excluídos não continuam aparecendo na lista.",
          "Mensagem clara quando o servidor está fora do ar.",
          "Digitar uma data não troca mais o ano no meio da digitação.",
          "Cores dos gráficos e das categorias mais legíveis, inclusive para daltônicos.",
        ],
      },
      {
        titulo: "Segurança",
        icone: "shield",
        itens: [
          "Seu nome e e-mail não são mais enviados a serviços de terceiros.",
          "Sair da conta encerra a sessão no servidor e apaga os dados do app neste navegador.",
          "Sem sessão ativa, as telas do sistema levam ao login.",
        ],
      },
      {
        titulo: "Removido",
        icone: "remove_circle_outline",
        itens: [
          'Agendamentos foram desativados por enquanto. Para lançamentos recorrentes, use "Repetir nos meses seguintes".',
          "O chat de suporte foi removido.",
        ],
      },
    ],
  },
];
