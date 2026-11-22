# FINANC — Release Notes · v1.0.2-alpha

**De:** v1.0.1-alpha, commit `9ddf2ae` (19/11/2026)
**Até:** v1.0.2-alpha, commit `b6ab6f5` (22/11/2026)
**Volume:** 1 commit · 16 arquivos · +748 / −43 linhas · `npm audit`: 0 vulnerabilidades

---

## Resumo

Esta versão traz a **importação da fatura do cartão do Nubank por CSV**, lançada como a primeira **função experimental** (liga e desliga nas Opções de usuário). Também chegam a **alteração de data em massa** e as **setas de mês na barra de filtros**, e os saldos passam a se atualizar logo depois de um cadastro. No celular, agora dá para **reorganizar os cards arrastando pelo ícone de 6 pontos**, e o botão **Novidades** avisa quando sai uma versão nova.

---

## 1. Novidades

### Funções experimentais
- Novo tópico **Experimental** em **Opções de usuário** (clique no perfil), com a opção "Funções experimentais".
- Desligada por padrão. A escolha fica salva no navegador (`funcoesExperimentais`) e vale na hora, sem recarregar.
- Hoje libera só o **Importar CSV**.

### Importar CSV da fatura do Nubank (experimental)
- **É uma função experimental:** para usar, clique no seu perfil, abra **Opções de usuário › Experimental** e ligue **Funções experimentais**. Só então o botão **Importar CSV** aparece na tela da conta (para quem pode editar a conta).
- Tipo do arquivo: **Cartão de crédito**. Débito aparece como "em breve".
- **Dia da virada da fatura** (1 a 28): compra antes do dia vai para a fatura do mês; no dia ou depois, para a do mês seguinte. A data lançada é o dia anterior à virada (virada 11 → dia 10).
- Cada compra vira uma **despesa pendente**. Cada estorno ("Estorno de <loja>", "Crédito de parcelamento de compra") vira uma **receita pendente** na data da fatura.
- "Pagamento recebido" e "Estorno de pagamento" são ignorados.
- Lê os dois formatos de valor do Nubank: `-84.62` (até fev/2026) e `"- 1.056,97"` (desde mar/2026).
- **Vários arquivos de uma vez**, numa prévia só. Se um arquivo for inválido, nenhum é importado e o erro mostra o nome dele.
- **Categorias** escolhidas valem para todas as movimentações importadas.
- Dia da virada e categorias ficam **salvos por conta** para a próxima importação.
- **Prévia** em tabela (título, compra → fatura, valor) com o total líquido antes de gravar.
- Grava uma por vez, com progresso "N de M". Se falhar, enviar de novo **continua de onde parou, sem duplicar**.

### Alterar data em massa
- Nova ação **Alterar data** no menu de selecionadas da tabela de transações.
- Todas as marcadas recebem a mesma data de movimentação. Os outros campos não mudam.
- Mesmo fluxo das demais ações em massa: confirmação, progresso e lista de falhas.

### Setas de período na barra de filtros
- Botões **‹ ›** ao lado de "Filtros", na tela da conta e no Dashboard.
- Avançam ou voltam um mês (ou o número de dias, se o período não for de meses inteiros) e buscam na hora, sem abrir o painel.

### Arrastar cards pelo celular
- Os cards de conta agora têm o ícone de **6 pontos** antes do nome, como os gráficos do dashboard.
- No celular, **segure o ícone de 6 pontos e arraste** para mudar a ordem dos cards de conta e dos gráficos do dashboard. Antes, arrastar só funcionava com o mouse.
- No computador nada muda: arraste o card de qualquer ponto, como antes.

### Aviso de novidades
- Quando sai uma versão nova, o botão **Novidades** (no fim do menu) ganha um **ponto vermelho**.
- O ponto some assim que você abre as novidades e só volta na próxima versão, mesmo que você saia e entre de novo.

---

## 2. Correções de bugs

- **Saldos após cadastrar:** o resumo do período (detalhes, "Real e projetado", rodapé do extrato) só atualizava ao clicar em Recarregar. Agora tudo atualiza junto depois do cadastro.
- **Arrastar no celular:** segurar um card de conta (ou do dashboard) para arrastar abria o menu "Abrir em nova guia". O menu não aparece mais no toque; com o mouse, o botão direito continua igual.
- **Card apagado no celular:** às vezes, depois de uma tentativa de arrastar, o card ficava transparente até recarregar a página. Não acontece mais.

---

## 3. Bugs e limitações conhecidos

| Item | Impacto | Situação |
|---|---|---|
| Importar CSV não detecta duplicadas | Importar a mesma fatura duas vezes duplica os lançamentos | Backlog |
| Importar CSV aceita só a fatura de crédito do Nubank | Débito e outros bancos ainda não | Backlog |
| Parcelas ("Parcela 1/3") entram só a da linha do CSV | As parcelas futuras não são lançadas | Backlog |
| Arrastar cards pelo teclado | Ainda não é possível mudar a ordem sem mouse ou toque | Backlog |
| Funções experimentais e preferências da importação ficam no navegador | Somem no logout e não acompanham entre dispositivos | Depende do back-end |
| Demais itens da v1.0.1-alpha | — | Ver `RELEASE_NOTES_v1.0.1-alpha.md` |
