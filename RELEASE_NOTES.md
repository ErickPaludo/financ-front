# FINANC — Release Notes

**Período:** 02/04/2026 (`a3b8019` — first commit) → 19/11/2026 (`63e6599`)
**Volume:** 67 commits · 157 arquivos alterados · +53,6 mil / −2,7 mil linhas

> Escrito pela ótica de Produto: o que mudou para quem usa o FINANC, e por que importa.

---

## Onde começamos x onde estamos

| | Primeiro commit (02/04) | Hoje (19/11) |
|---|---|---|
| **O que o usuário fazia** | Abria uma tela de login e autenticava na API. Nada além disso. | Gerencia várias contas bancárias, compartilha com outras pessoas, registra receitas e despesas, transfere entre contas, filtra, analisa em gráficos e faz ações em massa. |
| **Telas** | 1 (Home/login) | Login, Cadastro, Inicial, Tela da conta (transações), Dashboard + painéis de Membros, Convites, Usuário e Categorias |
| **Visual** | Template padrão do Vite | Identidade própria (nova logo), modo claro e escuro, interface em MUI |
| **Dispositivos** | Desktop | Desktop, celular e instalável como app (PWA) |

---

## 🚀 Destaques desta release

### 1. Dashboard da conta (novo)
Agora cada conta tem uma visão analítica:
- **Entradas e saídas** no tempo, em linhas ou barras, por dia (até 62 dias) ou por mês.
- **Entradas por categoria** e **Saídas por categoria** em rosca, com percentual por categoria — ou em linhas para ver a evolução.
- Usa **os mesmos filtros** da tela de transações (período, categorias, status, tipo), e os filtros viajam junto ao trocar de tela.
- **Ignorar categorias**: tira uma categoria da análise sem perder o resto da movimentação.
- Cards **arrastáveis**: cada usuário monta o dashboard na ordem que preferir.
- Cores das séries validadas para **daltonismo**.

### 2. Transferência entre contas (novo)
Botão **Transferir** na tela da conta: escolhe a conta de destino, valor e data, e o FINANC lança a saída numa conta e a entrada na outra, já com a descrição "Transferência para/da conta X". Botão ⇅ inverte origem e destino. Disponível só para quem pode editar.

### 3. Lançamentos recorrentes — "Repetir nos meses seguintes" (novo)
Ao cadastrar uma movimentação ou transferência, dá para repetir mensalmente por até 48 meses. Datas de fim de mês são respeitadas (31/01 → 28/02 → 31/03). Se algo falhar no meio, o sistema mostra "N de M criadas" e continua de onde parou, **sem duplicar**.

### 4. Ações em massa (novo)
Modo **Selecionar várias** na tabela de transações: marque várias linhas e **Conclua**, **Estorne** ou **Exclua** de uma vez. O sistema avisa quantas realmente serão afetadas, mostra o progresso e, no fim, lista cada falha com o motivo.

### 5. Ocultar valores em todas as telas
O botão de olho agora esconde saldos e valores na Inicial, na tela da conta e no Dashboard — útil para usar o app em público.

---

## ✨ Novas funcionalidades (histórico completo)

### Acesso e conta do usuário
- Login com **sessão persistente** e renovação automática (o usuário não é derrubado a cada expiração do token).
- **Cadastro de usuário**.
- **Alterar senha** (com opção de ver a senha digitada); ao trocar, as sessões são encerradas por segurança.
- Opções do usuário agora num **painel lateral** organizado por tópicos.

### Contas bancárias
- Cadastro e **edição** de contas (nome e cor), com prévia do card.
- Tela **Inicial** com resumo: patrimônio, saldo projetado (com alerta se negativo), receitas e despesas pendentes.
- Cards de conta com saldo, receitas e despesas; **reordenáveis** arrastando.
- Por conta: **favoritar**, **incluir/excluir do saldo total**, **sair da conta**.
- Atalho **"Última acessada"** e **Favoritos** na barra lateral.

### Compartilhamento
- **Convites**: enviar, aceitar, recusar e revogar, com prazo de expiração opcional.
- **Membros da conta** com níveis de acesso (Mestre, Administrador, Visualizador); o mestre edita permissões dos demais.

### Movimentações
- Cadastro, **edição**, **conclusão** e **estorno** de receitas e despesas.
- **Múltiplas categorias** por movimentação, com cor própria.
- Gestão de **categorias** (criar, editar, paleta de cores acessível, aviso de nome repetido).
- **Filtros** por período (com atalhos: este mês, mês passado, próximo mês, últimos 30 dias, este ano), categorias, status e tipo, além de **busca por texto**.
- Filtros salvos **na URL**: dá para recarregar, compartilhar o link ou abrir em nova guia sem perder a visão.
- Saldo atualiza **na hora** após um lançamento, sem recarregar a tela toda.
- Tabela configurável: ordenar, reordenar e ocultar colunas, salvar preferências e alternar para **modo cards** (padrão no celular).

### Experiência e plataforma
- **Modo claro e escuro** (segue o sistema por padrão).
- **Nova identidade visual** e nova logo.
- **Layout responsivo** e menu lateral para celular.
- **PWA**: instalável, funciona offline e avisa quando há nova versão.
- Links reais em toda a navegação: botão direito → "Abrir em nova guia" funciona.

---

## 🐛 Correções relevantes
- **Datas deslocadas em 3h** no cadastro, edição e filtros: agora tudo é enviado em UTC corretamente.
- Saldo das contas não atualizava após cadastrar uma movimentação.
- Rota incorreta ao deslogar.
- Mensagens de erro de convite que ficavam na tela após fechar o formulário.
- Item removido que continuava aparecendo na lista após nova busca.
- Digitação de datas pela metade (ex.: ano "0202") alterava a data por engano.

---

## 🔄 Mudanças e remoções
- **Agendamentos**: a tela de movimentações agendadas foi **desativada** nesta versão (o código foi mantido para reativação futura). A necessidade de lançamentos recorrentes passa a ser coberta por **"Repetir nos meses seguintes"**.
- **Suporte via chatbot (Landbot)**, adicionado em abril, não faz mais parte do produto.
- As antigas telas de Membros, Convites e Usuário viraram **painéis laterais**: menos troca de tela, contexto preservado.
- Ao **sair**, todas as preferências locais (ordem dos cards, colunas da tabela, tema) são limpas.

---

## ⚠️ Pontos de atenção / backlog
| Item | Impacto |
|---|---|
| Rotas logadas não redirecionam para o login sem sessão | Segurança/UX — prioridade alta |
| Preferências (ordem de cards, colunas) ficam só no navegador | Não sincroniza entre dispositivos; depende do back-end |
| Arrastar cards não funciona no toque nem no teclado | Acessibilidade e mobile |
| Sem URL de produção definida | Bloqueia deploy público |
| Agendamentos desativados | Avaliar retorno ou substituição definitiva pela repetição |
