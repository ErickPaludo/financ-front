// Novidades exibidas no painel "Novidades" da barra lateral, da versão mais nova para a mais antiga.
// Versão nova: acrescente uma entrada no topo (a mesma do package.json).
export type Novidade = {
  versao: string;
  data: string; // dd/mm/aaaa
  grupos: { titulo: string; icone: string; itens: string[] }[];
};

export const NOVIDADES: Novidade[] = [
  {
    versao: "1.0.4-alpha",
    data: "26/11/2026",
    grupos: [
      {
        titulo: "Novidades",
        icone: "auto_awesome",
        itens: [
          "Copiar uma transação: clique nela e escolha Copiar. Você escolhe a data e uma nova transação igual é criada, pendente. Disponível para quem pode editar a conta.",
        ],
      },
      {
        titulo: "Correções",
        icone: "build",
        itens: [
          "Quem só visualiza a conta não abre mais as opções ao clicar numa transação: antes apareciam botões que não podia usar.",
        ],
      },
    ],
  },
  {
    versao: "1.0.3-alpha",
    data: "23/11/2026",
    grupos: [
      {
        titulo: "Novidades",
        icone: "auto_awesome",
        itens: [
          "Exportar (experimental): baixe as transações da tela em CSV, que abre direto no Excel, ou em PDF, um relatório com a logo da PldProjects e o nome da conta. Sai o que está na tela, já com os filtros aplicados, e com todas as colunas da tabela.",
          "Importar CSV de qualquer banco (experimental): agora também o extrato da conta, além da fatura do cartão. Você escolhe qual coluna do arquivo é o título, o valor, a data e a descrição, e a escolha fica salva para a próxima vez.",
          "Ignorar categorias também nos filtros das transações: as transações dessas categorias saem da lista na hora.",
          "Para ligar as funções experimentais: Opções de usuário › Experimental › Funções experimentais.",
        ],
      },
      {
        titulo: "Correções",
        icone: "build",
        itens: [
          "Os detalhes do período (Geral, Resto, Entradas e Saídas) e o total de gastos agora acompanham a busca por texto e as categorias ignoradas, como a lista e o saldo do período.",        ],
      },
    ],
  },
  {
    versao: "1.0.2-alpha",
    data: "22/11/2026",
    grupos: [
      {
        titulo: "Novidades",
        icone: "auto_awesome",
        itens: [
          "Funções experimentais: ligue em Opções de usuário › Experimental para testar o que ainda está em desenvolvimento.",
          "Importar CSV da fatura do cartão do Nubank: é uma função experimental, então primeiro ligue Opções de usuário › Experimental › Funções experimentais; depois o botão Importar CSV aparece na tela da conta. Cada compra vira uma despesa na data da fatura e cada estorno vira uma receita. Aceita vários arquivos de uma vez, e o dia da virada e as categorias ficam salvos por conta.",
          "Alterar data em massa: selecione várias transações e mude a data de todas de uma vez.",
          "Setas na barra de filtros para ir ao mês anterior ou ao próximo sem abrir o painel.",
          "Reorganize os cards pelo celular: segure o ícone de 6 pontos e arraste. Vale para os cards de conta e para os gráficos do dashboard.",
          "O botão Novidades ganha um ponto quando sai uma versão nova, e o ponto some depois que você abre as novidades.",
        ],
      },
      {
        titulo: "Correções",
        icone: "build",
        itens: [
          "Depois de cadastrar uma transação, os saldos e o resumo do período se atualizam na hora.",
          'No celular, segurar um card de conta para arrastar não abre mais o menu "Abrir em nova guia".',
          "No celular, um card não fica mais apagado depois de uma tentativa de arrastar.",
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
