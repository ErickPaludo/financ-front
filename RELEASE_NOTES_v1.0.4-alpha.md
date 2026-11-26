# FINANC — Release Notes · v1.0.4-alpha

**Data:** 26/11/2026
**Versão anterior:** v1.0.3-alpha (23/11/2026)

---

## Resumo

Esta versão traz a opção de **copiar uma transação**: com dois cliques você cria uma nova transação igual a outra, na data que escolher. No Dashboard, o detalhe dos gráficos de categoria em linhas fica mais limpo. Também deixa a tela mais clara para quem só **visualiza** a conta.

---

## 1. Novidades

### Copiar uma transação
- Clique numa transação e escolha **Copiar**.
- Escolha a **data** da cópia (já vem com a data da original) e clique em **Criar cópia**.
- A nova transação sai igual à original: título, valor, tipo (receita ou despesa), categorias e observação.
- A cópia sempre entra **pendente**, mesmo que a original esteja concluída. Para concluir, clique nela ou use as ações em massa.
- Disponível para quem pode editar a conta (**mestre** e **administrador**).

### Dashboard: detalhe das categorias mais limpo
- Nos gráficos **Saídas por categoria** e **Entradas por categoria**, no formato **Linhas**, ao passar o mouse sobre uma data, o detalhe mostra **só as categorias que têm valor naquele dia**. Antes apareciam todas, a maioria com R$ 0,00.
- Categorias sem nenhum valor no período inteiro já não apareciam no gráfico, e continua assim.

---

## 2. Correções de bugs

- **Visualizador via opções que não podia usar:** quem só visualiza a conta, ao clicar numa transação, via os botões Deletar, Alterar e Concluir, que davam erro ao usar. Agora clicar na transação não abre nada para quem só visualiza.

---

## 3. Bugs e limitações conhecidos

| Item | Impacto | Situação |
|---|---|---|
| A cópia não mantém a conclusão | A transação copiada sempre entra pendente | Decisão desta versão |
| Demais itens da v1.0.3-alpha | — | Ver `RELEASE_NOTES_v1.0.3-alpha.md` |
