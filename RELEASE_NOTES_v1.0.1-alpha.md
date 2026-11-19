# FINANC — Release Notes · v1.0.1-alpha

**De:** repositório original [financ-gestaofinanceira/financproject](https://github.com/financ-gestaofinanceira/financproject), commit `b54b22c` (24/06/2026)
**Até:** código atual, commit `63e6599` (19/11/2026) + alterações ainda não commitadas (seção 5)
**Volume:** 16 commits · 225 arquivos · +14,4 mil / −9,8 mil linhas · `npm audit`: 0 vulnerabilidades

---

## Resumo

Esta versão reconstrói o FINANC: navegação com endereços reais, identidade visual nova com modo claro, um **Dashboard** analítico e três recursos pedidos para o dia a dia: **transferência entre contas**, **lançamentos repetidos** e **ações em massa**. Também fecha falhas de segurança herdadas do projeto original, entre elas o envio do nome e do e-mail do usuário para um serviço de terceiros.

---

## 1. Novidades

### Dashboard da conta
- Nova tela por conta (`/:idConta/dashboard`, subtópico "Dashboard" na barra lateral).
- **Entradas e saídas** no período, em linhas ou barras, por dia (até 62 dias) ou por mês. Dá para ver as duas séries ou só uma.
- **Entradas por categoria** e **Saídas por categoria** em rosca, com % por categoria e total no topo, ou em linhas para ver a evolução no tempo.
- Usa os **mesmos filtros** da tela de transações, e eles acompanham o usuário ao trocar de tela pela barra lateral.
- **Ignorar categorias:** tira uma categoria da análise sem perder a movimentação inteira. A escolha fica salva por conta.
- Gráficos **arrastáveis**: cada usuário escolhe a ordem.
- Cores validadas para **daltonismo** (azul/laranja) nos dois modos.

### Transferência entre contas
- Botão **Transferir** na tela da conta, só para quem pode editar.
- Lança a saída na conta de origem e a entrada na de destino, com a mesma data e valor e a descrição "Transferência para/da conta X".
- Botão ⇅ inverte origem e destino. Cada lado tem as suas categorias.
- Só aparecem as contas em que o usuário é mestre ou administrador.

### Repetir nos meses seguintes
- No cadastro de movimentação e na transferência: repete mensalmente por até **48 meses**.
- Respeita fim de mês (31/01 → 28/02 → 31/03).
- Se uma criação falhar, mostra "N de M criadas" e o reenvio **continua de onde parou, sem duplicar**.

### Ações em massa
- Modo **Selecionar várias** na tabela de transações.
- **Concluir** (na data de hoje ou na data de cada movimentação), **Estornar** e **Excluir** várias de uma vez.
- Antes de executar, mostra quantas serão afetadas (ex.: concluir ignora as já concluídas). Durante, mostra o progresso "N de M". No fim, lista cada falha com título, data e o motivo informado pela API. As que falharam continuam selecionadas.

### Tela da conta (transações)
- **Filtros em painel** (gaveta lateral), com chips dos filtros ativos na barra da tabela e "Limpar tudo".
- **Período** com setas ‹ › (avança mês a mês ou pelo número de dias) e atalhos: Este mês, Mês passado, Próximo mês, Últimos 30 dias, Este ano.
- **Busca por texto** no título e na observação, sem diferenciar acentos nem maiúsculas.
- **Filtros na URL:** recarregar, favoritar ou enviar o link mantém a mesma visão.
- Cards de resumo: saldo atual, saldo projetado, receitas e despesas pendentes. Atualizam **na hora** após um lançamento.
- **Tabela configurável:** ordenar clicando no cabeçalho; reordenar, ocultar e mostrar colunas; salvar as preferências; "Redefinir colunas".
- **Modo cards** (uma linha por card), padrão no celular.
- Botões Recarregar e Maximizar; switch "Ver detalhes".

### Tela inicial
- Novo resumo: saudação, **patrimônio**, saldo projetado (com alerta se negativo), receitas e despesas pendentes.
- Cards de conta redesenhados (faixa e avatar na cor da conta, receitas/despesas, indicação de conta fora do total).
- Cards **arrastáveis**, com a ordem salva por usuário.
- Menu ⋮ no card: favoritar, somar ou não no saldo total, **editar nome e cor** (gaveta com prévia; antes era uma tela separada) e sair da conta.
- Card tracejado "Adicionar conta".

### Ocultar valores
- Botão de olho na Inicial, na tela da conta e no Dashboard: esconde todos os valores em R$.

### Barra lateral e painéis
- Barra lateral nova: Contas, conta atual com subtópicos (Dashboard, Membros), **Última acessada**, **Favoritos**, Convites e o menu do usuário no rodapé.
- **Membros**, **Convites** e **Opções de usuário** viraram **painéis ao lado da barra**, sem sair da tela em que o usuário está.
- Convites: abas Recebidos (com a contagem de pendentes) e Enviados; aceitar, recusar e revogar; "Convidar membro" com escolha da conta.
- Membros: ícones de nível de acesso, inativo e expiração; o mestre edita os demais.

### Categorias
- Gaveta nova com pesquisa, prévia do chip, aviso de nome repetido e **paleta de cores com contraste garantido**.
- A categoria recém-criada aparece destacada na lista.

### Visual e plataforma
- **Modo claro** (além do escuro); segue o sistema por padrão.
- **Nova logo** e identidade visual; toda a interface migrada para Material UI.
- Campos de data com calendário em português.
- **Aviso de nova versão** e de app pronto para uso offline (PWA).
- Links reais em toda a navegação: "Abrir em nova guia", Ctrl+clique e clique do meio funcionam.

---

## 2. Correções de bugs

| Antes | Agora |
|---|---|
| Filtro de período **deslocado em 3h**: movimentações do começo ou do fim do dia sumiam | Datas enviadas em UTC real em cadastro, conclusão e filtros |
| **F5** voltava sempre para a lista de contas | Cada tela tem endereço próprio; conta e filtros vêm da URL |
| Trocar o filtro rápido mostrava o **resultado do filtro anterior** | Respostas antigas são descartadas |
| Ao excluir o último item de uma lista, **ele continuava na tela** | Lista vazia é tratada corretamente |
| Com o **servidor fora do ar**, o login travava ou não mostrava erro | Sempre aparece uma mensagem clara |
| **Erros intermitentes de autorização** ao abrir o app | O token vale desde a primeira requisição |
| Sessão às vezes **não era restaurada** ao abrir o app direto numa tela | Restauração pelo usuário salvo |
| Digitar um ano pela metade (ex.: "0202") **trocava a data** | Só salva com o ano completo e dentro dos limites |
| Datas sem limite quebravam a busca | Período de no máximo 100 anos |
| Valor do gráfico **aparecia longe do mouse** | Tooltip posicionado corretamente |
| Gráficos em verde/vermelho, **ilegíveis para daltônicos** | Azul/laranja validados |
| Texto dos chips de categoria **apagado** em cores fortes | Contraste mínimo garantido |
| Horário das agendadas ajustado com **3h fixas no código** | Conversão centralizada |

---

## 3. Segurança

- **Dados pessoais deixaram de ir para terceiros:** o chatbot de suporte (Landbot) recebia o nome e o e-mail do usuário pela URL. A integração foi removida.
- **Dados sensíveis fora do console:** removidos cerca de 30 `console.log` com o usuário logado, os dados de cadastros e as respostas da API.
- **Renovação de sessão mais segura:** feita uma única vez, por um canal separado, sem risco de repetição em loop.
- **Logout completo:** revoga a sessão no servidor e apaga todos os dados do app no navegador (importante em computador compartilhado).
- **Acesso por conta validado:** abrir uma conta inexistente, inativa ou sem permissão leva de volta à Inicial; ações de edição respeitam o nível de acesso.
- Removido um arquivo `index.zip` que estava versionado no repositório.
- Removidas dependências sem uso (`axion`, `bootstrap`, `react-colorful`, `react-google-charts`).

---

## 4. Removido / alterado

- **Agendamentos:** a tela de movimentações agendadas está **desativada** (o código foi mantido). Para lançamentos recorrentes, use **Repetir nos meses seguintes**.
- **Suporte por chatbot (Landbot):** removido.
- **Telas que viraram painéis ou gavetas:** Membros, Convites, Opções de usuário e Editar conta.
- **Endereços:** saem `#/` e `#/home` e entram `/login`, `/registrar`, `/`, `/:idConta/contabancaria` e `/:idConta/dashboard`. O antigo `/inicial` redireciona para `/`.
- **Logout** apaga as preferências locais (ordem dos cards, colunas da tabela, tema).

---

## 5. Incluído nesta versão (ainda não commitado)

- **Rotas protegidas:** sem sessão, as telas logadas redirecionam para `/login`.
- **App não quebra mais** ao abrir com dados locais corrompidos ou com o armazenamento do navegador bloqueado (aba anônima).
- **URL da API configurável** por ambiente (`.env.development` / `.env.production`, modelo em `.env.example`). Em desenvolvimento, o app usa o back-end local em vez do de produção.
- **Versão única** no `package.json` (`1.0.1-alpha`), exibida na barra lateral como `v1.0.1-alpha`. Antes aparecia "Alpha v1.0.1.0".
- `dev-dist/` (arquivos gerados em desenvolvimento) saiu do repositório.

---

## 6. Bugs e limitações conhecidos

| Item | Impacto | Situação |
|---|---|---|
| Deploy no GitHub Pages em `/financproject/` não funciona sem o `base` do Vite | Bloqueia publicar nesse endereço | Precisa de domínio próprio ou raiz |
| Back-end precisa enviar o cookie de sessão como `SameSite=None; Secure; Partitioned` em produção cross-site | Sem isso, a sessão não se renova | Pendente no back-end |
| Ordem dos cards, colunas e outras preferências ficam só no navegador | Não acompanham o usuário entre dispositivos e somem no logout | Depende do back-end |
| Arrastar cards não funciona com toque nem com teclado | Celular e acessibilidade | Avaliar `@dnd-kit` |
| Se a revogação da sessão falhar (sem internet), o logout local acontece mesmo assim | A sessão continua válida no servidor até expirar | Aceito |
| Nome e e-mail ficam salvos no navegador (sem token) | Baixo | Aceito |
| A saudação da madrugada (22h–3h) nunca aparece | Cosmético | Mantido por decisão do produto |
| Agendamentos desativados | Recorrência só mensal, via "Repetir" | Decidir retorno ou remoção definitiva |
| Os arquivos `.env` não vão para o git | Cada máquina ou deploy precisa criá-los a partir do `.env.example` | Por design |
| Não há testes automatizados de tela; só scripts de lógica pura | Regressões visuais dependem de teste manual | Backlog |
