# FINANC — Release Notes · v1.0.4-alpha

**Data:** 26/11/2026
**Versão anterior:** v1.0.3-alpha (23/11/2026)

---

## Resumo

Esta versão traz a opção de **copiar uma transação** (também repetindo nos meses seguintes) e de **alterar as categorias de várias transações de uma vez**. No Dashboard, o gráfico Entradas e saídas ganha o **saldo da conta**, **quanto sobrou** no período e novas cores, e o detalhe dos gráficos de categoria em linhas fica mais limpo. Os filtros ganham os atalhos **Hoje** e **Últimos 7 dias**, as categorias marcadas aparecem primeiro nas listas e o **campo de data e hora** passa a aceitar a digitação direto. Também deixa a tela mais clara para quem só **visualiza** a conta e corrige valores zerados que apareciam como "-R$ 0,00".

---

## 1. Novidades

### Copiar uma transação
- Clique numa transação e escolha **Copiar**.
- Escolha a **data** da cópia (já vem com a data da original) e clique em **Criar cópia**.
- A nova transação sai igual à original: título, valor, tipo (receita ou despesa), categorias e observação.
- Marque **Repetir nos meses seguintes** e escolha até que mês, como no cadastro: é criada uma cópia por mês, a partir da data escolhida (até 48 meses). Se alguma falhar no meio, clicar de novo em **Criar cópia** cria só as que faltam.
- A cópia sempre entra **pendente**, mesmo que a original esteja concluída. Para concluir, clique nela ou use as ações em massa.
- Disponível para quem pode editar a conta (**mestre** e **administrador**).

### Dashboard: saldo da conta no gráfico Entradas e saídas
- Novo botão de **saldo** (ícone de banco) no gráfico **Entradas e saídas**. Ligado, aparece em **azul** o saldo da conta ao fim de cada dia (ou de cada mês, em períodos maiores). O último ponto é o saldo no último dia do filtro.
- O saldo usa a mesma escala das entradas e saídas, à esquerda. Quando o saldo é bem maior que o movimento do período, as barras e linhas de entradas e saídas ficam mais baixas.
- Começa **desligado**: em períodos longos, o saldo de cada mês é uma consulta a mais (num ano, 12), e pode demorar um pouco.
- Com **Ignorar categorias**, o saldo desconta as transações que saíram do Dashboard.
- Vale nos dois formatos do gráfico: em **Linhas** o saldo é uma linha azul, em **Barras** uma barra azul.

### Dashboard: quanto sobrou no período
- No gráfico **Entradas e saídas**, ao lado dos totais, aparece **quanto sobrou** no período (entradas menos saídas). Quando as saídas passam das entradas, aparece **Faltou** com a diferença.
- Aparece quando o filtro mostra entradas e saídas (Tipo = Todas).
- No gráfico, o botão de **sobra** (ícone de cofrinho) mostra em **amarelo** quanto sobrou. **Por dia**, são as entradas menos as saídas desde o início do período, somando a sobra dos dias anteriores (entrou R$ 3.000 e saiu R$ 1.000 no dia 1, sobra R$ 2.000; saiu mais R$ 1.000 no dia 2, a sobra fica em R$ 1.000). **Por mês** (períodos maiores), é só o que sobrou naquele mês, sem somar os anteriores (entrou R$ 1.000 e saiu R$ 1.000 no mês, sobra R$ 0). Abaixo do zero, faltou. No formato Barras ela é uma barra a mais; em Linhas, uma linha. Começa desligada.

### Dashboard: só os dias com movimentação
- No gráfico **Entradas e saídas**, o novo botão **Só dias com movimentação** (ícone de calendário com visto) esconde os dias sem nenhuma entrada ou saída, e o gráfico fica só com os dias que tiveram movimento. Em períodos maiores, que o gráfico mostra por mês, esconde os meses sem movimento.
- Os totais do período não mudam. Começa desligado.

### Dashboard: os botões do Entradas e saídas ficam lembrados
- Os botões de **saldo**, **sobra** e **Só dias com movimentação** ficam como você deixou: ao voltar ao Dashboard ou recarregar a página, continuam ligados ou desligados. Vale para este navegador.

### Dashboard: ver as transações de um dia com dois cliques
- No gráfico **Entradas e saídas**, dê **dois cliques** num dia para abrir, numa **nova aba**, a tela da conta com as transações daquele dia. Em períodos maiores, que o gráfico mostra por mês, abre as transações do mês clicado.
- Os outros filtros (categorias, status e tipo) vão junto. As categorias ignoradas, não: na tela da conta, escolha de novo se quiser.

### Dashboard: categorias ignoradas como atalho
- As categorias ignoradas aparecem no topo do Dashboard como **atalhos**. A ignorada fica **desabilitada**: apagada, com o nome riscado e o olho cortado. Clique nela para **voltar a considerar**: ela continua ali, normal. Clique de novo para ignorar outra vez.
- Para tirar o atalho de vez, clique no **X** do chip ou desmarque a categoria em **Ignorar categorias**, no Filtros (o **Limpar tudo** também tira todos).
- Os atalhos ficam lembrados para cada conta, neste navegador.

### Dashboard: filtro de categorias lembrado
- As categorias escolhidas no **Filtros** do Dashboard ficam lembradas para cada conta: ao abrir o Dashboard de novo, o filtro volta como você deixou. Para tirar, remova as categorias no Filtros ou no X do chip.
- Se você chegar ao Dashboard por um link que já traz categorias (por exemplo, vindo da tela da conta com categorias filtradas), valem as do link.

### Dashboard: botão Recarregar
- Novo botão **Recarregar** (seta redonda) no topo do Dashboard, ao lado do botão de ocultar valores. Ele atualiza todos os gráficos com os dados mais recentes, sem precisar recarregar a página: útil quando outra pessoa lançou transações na conta ou você lançou em outra aba.

### Dashboard: novas cores no Entradas e saídas
- **Entradas em verde**, **saídas em vermelho**, **sobra em amarelo** e o **saldo em azul**.

### Dashboard: detalhe das categorias mais limpo
- Nos gráficos **Saídas por categoria** e **Entradas por categoria**, no formato **Linhas**, ao passar o mouse sobre uma data, o detalhe mostra **só as categorias que têm valor naquele dia**. Antes apareciam todas, a maioria com R$ 0,00.
- Categorias sem nenhum valor no período inteiro já não apareciam no gráfico, e continua assim.

### Alterar categorias de várias transações de uma vez
- Em **Selecionar várias**, marque as transações e escolha **Alterar categorias** no menu **Selecionadas**.
- Escolha **o que fazer** e as categorias:
  - **Adicionar às atuais:** cada transação mantém as categorias que já tinha e ganha as escolhidas.
  - **Remover das atuais:** tira as categorias escolhidas e mantém as demais.
  - **Substituir as atuais:** todas ficam só com as categorias escolhidas. Sem nenhuma escolhida, todas ficam sem categoria (a tela avisa antes).
- Como nas outras ações em massa, o progresso aparece enquanto altera e, no fim, quantas deram certo e o motivo de cada uma que falhou. As que falharam continuam marcadas para tentar de novo.
- Disponível para quem pode editar a conta (**mestre** e **administrador**).

### Alterar o valor de várias transações de uma vez
- Em **Selecionar várias**, marque as transações e escolha **Alterar valor** no menu **Selecionadas**.
- Digite o **novo valor**: todas as marcadas ficam com ele, no lugar do valor que tinham.
- Receitas continuam receitas e despesas continuam despesas: só o valor muda.
- Como nas outras ações em massa, o progresso aparece enquanto altera e, no fim, quantas deram certo e o motivo de cada uma que falhou.
- Disponível para quem pode editar a conta (**mestre** e **administrador**).

### Confirmação nas ações em massa
- Toda ação em **Selecionadas** (Concluir, Extornar, Alterar data, Alterar valor, Alterar categorias e Excluir) agora pergunta **"Tem certeza?"** antes de começar, dizendo quantas transações vão mudar e, quando for o caso, o novo valor ou a nova data. Só começa depois do **Sim**.

### Alterar data em massa: data inicial e botão "Agora"
- Em **Alterar data**, o campo já vem com o **primeiro dia do período do filtro, às 08:00**, em vez da data e hora atuais.
- Ao lado do campo, o botão **Agora** coloca a data e a hora atuais.

### Alterar data em massa: trocar só o dia
- Em **Alterar data**, escolha em **O que mudar** a opção **Só o dia** e o novo dia (de 1 a 31).
- Cada transação vai para esse dia **no mês dela**, mantendo o mês, o ano e a hora. Exemplo: com o dia 10, uma de 05/01 vai para 10/01 e uma de 20/03 vai para 10/03.
- Se o mês não tem o dia escolhido, a transação vai para o último dia do mês (dia 31 em fevereiro vira 28, ou 29 em ano bissexto).
- A opção **Data inteira** continua como antes: todas ficam com a mesma data e hora.

### "Repetir até" acompanha a data
- Em **Repetir nos meses seguintes** (nova transação, transferência e cópia), ao mudar a data da transação, o **Repetir até** anda junto e mantém a mesma quantidade de meses. Antes ele ficava parado e podia dar erro.

### Atalhos "Hoje" e "Últimos 7 dias" nos filtros
- No período dos **Filtros** (tela da conta e Dashboard), dois atalhos novos:
  - **Hoje:** só o dia de hoje, da meia-noite às 23:59.
  - **Últimos 7 dias:** hoje e os 6 dias anteriores, da meia-noite do primeiro às 23:59 de hoje.
- As setas ‹ › andam o mesmo número de dias do atalho (1 ou 7).

### Categorias marcadas primeiro
- Nas listas de categorias com caixas de marcar (Filtros, nova transação, transferência e Importar CSV), as categorias **já marcadas aparecem no topo** ao abrir a lista, sem precisar procurar.
- Enquanto a lista está aberta, a ordem não muda ao marcar ou desmarcar, para nada sair do lugar embaixo do mouse. Ao abrir de novo, ela se reorganiza.

### Preferências mantidas ao sair e entrar de novo
- Antes, ao **sair** do app, todas as suas preferências eram apagadas: modo claro ou escuro, valores ocultos, ordem das contas e dos gráficos, colunas das tabelas, filtros e botões do Dashboard, funções experimentais e outras.
- Agora elas ficam guardadas para o seu e-mail **neste navegador**: ao entrar de novo, tudo volta como você deixou.
- Cada pessoa que usa o mesmo navegador tem as próprias preferências: quem entrar com outro e-mail não vê as suas.

---

## 2. Correções de bugs

- **Visualizador via opções que não podia usar:** quem só visualiza a conta, ao clicar numa transação, via os botões Deletar, Alterar e Concluir, que davam erro ao usar. Agora clicar na transação não abre nada para quem só visualiza.
- **Campo de data e hora não aceitava a digitação:** às vezes o campo ignorava o que se digitava. Agora é um campo de texto: digite só os números (por exemplo, 261120261430 vira 26/11/2026 14:30), as barras e os dois-pontos já estão no lugar. Cada número fica na sua posição: dá para selecionar só o ano (ou o dia, ou a hora) e digitar por cima, sem mexer no resto. Com a hora em branco, fica a que já estava. Data que não existe (como 31/02) ou fora do período permitido fica marcada em vermelho e não é salva; ao sair do campo ele volta à última data válida. O ícone de calendário ao lado escolhe o dia com o mouse.
- **Valor "-R$ 0,00":** alguns valores zerados apareciam com sinal de menos (por exemplo, o saldo de um dia no Dashboard). Agora aparecem como R$ 0,00 em todo o app. No Dashboard, com o saldo da conta em zero, o eixo do gráfico também se mantém normal.

---

## 3. Bugs e limitações conhecidos

| Item | Impacto | Situação |
|---|---|---|
| A cópia não mantém a conclusão | A transação copiada sempre entra pendente | Decisão desta versão |
| Saldo por mês faz uma consulta por mês | Em períodos longos a linha de saldo demora mais a aparecer | Decisão desta versão (só com o botão ligado) |
| Saldo por dia é calculado a partir do saldo do fim do período | Se o saldo da conta não for o do último dia do filtro, os dias anteriores saem errados | Em observação |
| Demais itens da v1.0.3-alpha | — | Ver `RELEASE_NOTES_v1.0.3-alpha.md` |
