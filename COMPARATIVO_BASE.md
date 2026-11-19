# FINANC — Comparativo com o projeto base

**Base:** [financ-gestaofinanceira/financproject](https://github.com/financ-gestaofinanceira/financproject), branch `main`, commit `b54b22c` (24/06/2026, "Bug de data no cadastro e edicao de movimentacoes foi corrigido")
**Atual:** `63e6599` (19/11/2026, "Opção de transferencias entre contas")
**Diferença:** 16 commits · 225 arquivos · +14,4 mil / −9,8 mil linhas
**`npm audit` (dependências de produção):** 0 vulnerabilidades

> O `main` do repositório base termina exatamente em `b54b22c`, que também está no histórico deste projeto. Tudo a partir de `10dee2b` (16/11) é deste projeto.

---

## 1. Resumo para a liderança

| Tema | Base | Atual |
|---|---|---|
| Dados pessoais enviados a terceiros | Nome e e-mail do usuário iam na URL do chatbot Landbot | Chatbot removido. Nada é enviado a terceiros |
| Dados sensíveis no console do navegador | Usuário logado, payloads de cadastro e de membros, erros da API | Só o erro de registro do service worker |
| Requisições sem token logo após abrir o app | Sim (corrida entre os interceptors e as telas) | Não: o token é aplicado desde a primeira requisição |
| Logout em computador compartilhado | Apagava só o usuário | Apaga todo o `localStorage` e revoga a sessão no servidor |
| Servidor fora do ar / sem internet | Telas tratavam como sucesso ou quebravam | Sempre retorna uma mensagem de erro |
| Datas e filtros | Período deslocado em 3h | Datas enviadas em UTC real |
| Recarregar a página | Voltava para a tela de contas (a navegação era estado em memória) | Mantém a tela, a conta e os filtros (estão na URL) |
| Arquivos indevidos no repositório | `src/index.zip` versionado | Removido |

---

## 2. Segurança

### ✅ Corrigido

| # | Problema na base | Risco | Como ficou |
|---|---|---|---|
| S1 | **Vazamento de dados pessoais (PII) para terceiros.** O `LandBotComponent` montava `https://landbot.online/...?name=<nomeCompleto>&email=<email>` num iframe | Nome e e-mail ficavam nos logs, no histórico e no analytics de um fornecedor externo, sem consentimento explícito (LGPD) | Componente e integração removidos |
| S2 | **Dados sensíveis no console.** `console.log(user)` no login, `console.log(request)` no cadastro de movimentação e na edição de membro, `console.log(members)`, `console.log(msgErro)` em toda chamada da API (cerca de 30 ocorrências) | Qualquer pessoa com acesso ao navegador (ou extensão) lê dados do usuário e das contas | Removidos. Sobrou só `console.error` do service worker |
| S3 | **Requisições sem `Authorization` ao abrir o app.** Os interceptors eram registrados num `useEffect` do `AuthProvider`, que roda **depois** dos efeitos das telas filhas | As primeiras chamadas saíam sem token e recebiam 401 sem passar pelo refresh: erros intermitentes e logout indevido | Interceptors registrados no módulo `services/api/api.ts`, válidos desde o carregamento. O token fica fora do React (`setAccessToken`) |
| S4 | **Refresh pela mesma instância com interceptors.** O loop era evitado só comparando a URL | Refresh disparando outro refresh se a rota mudasse | Instância `authApi` separada, sem interceptors. O refresh é compartilhado entre requisições simultâneas e feito uma vez só |
| S5 | **Logout parcial.** `localStorage.removeItem("user")` | Em computador compartilhado, as preferências e os dados do usuário anterior ficavam no navegador | `localStorage.clear()` no logout. `useEncerrarSessao` revoga o refresh token (`/Autenticacao/revoke`) antes |
| S6 | **Logout sem navegação centralizada.** Usava `window.location.hash = "#/"` espalhado pelo código | Algumas saídas deixavam o usuário numa tela logada sem sessão | O `logout()` do `AuthContext` sempre navega para `/login` com `replace` (o voltar do navegador não reabre a tela). Refresh falho chama `onExpirada` → logout |
| S7 | **`Conecta` aceitava qualquer `metodo: string`** e capturava erro como `any` | Erro de digitação no método só aparecia em produção | Tipo `"GET" \| "POST" \| "PATCH" \| "PUT" \| "DELETE"`, `isAxiosError` e `api.request` único |
| S8 | **Conta acessada sem validação.** A conta vinha de estado em memória | — | `ContaDaRota` busca a conta pelo id da URL. Conta inexistente, inativa ou sem acesso volta para `/`. Ações de edição respeitam a permissão (`podeEditar`; edição de membros só para o mestre, e nunca de outro mestre) |
| S9 | **`src/index.zip` versionado** (um zip com CSS) | Arquivo binário opaco no repositório: não dá para revisar o conteúdo | Removido |

### ⚠️ Riscos encontrados no código atual

> **Situação (19/11/2026):**
> - **R1, R2, R4 e R6:** corrigidos.
> - **R3 e R5:** aceitos. São limitações conhecidas e o front não tem o que corrigir.
>
> | Risco | Correção |
> |---|---|
> | R1 | `LayoutPrincipal` redireciona para `/login` quando não há usuário salvo nem token |
> | R2 | `api.ts` usa `/api` (proxy local) em dev e a URL de produção só no build |
> | R4 | `try/catch` em leitura, gravação e limpeza do `localStorage` no `AuthContext` |
> | R6 | `dev-dist/` fora do git e no `.gitignore` |

| # | Problema | Impacto | Recomendação |
|---|---|---|---|
| R1 | **Rotas logadas sem proteção.** Sem usuário salvo, a tela renderiza e só vai para `/login` depois do primeiro 401 | O "esqueleto" da área logada aparece por um instante. Os dados continuam protegidos pela API | Envolver o `LayoutPrincipal` num guard: sem `user` (ou com `inicializando`), `<Navigate to="/login">` ou carregamento |
| R2 | **`api.ts` aponta fixo para `https://api.pldprojects.com.br/api`** desde `10dee2b`, inclusive em dev. O proxy `/api` do Vite ficou sem uso (o `CLAUDE.md` ainda diz que dev usa `/api`) | Desenvolvimento local lê e grava dados **de produção**; o cookie de refresh é cross-site | `baseURL = import.meta.env.DEV ? "/api" : import.meta.env.VITE_API_URL` |
| R3 | **Revogação silenciosa.** Se `/Autenticacao/revoke` falhar (offline), o logout local acontece mesmo assim | O refresh token continua válido no servidor até expirar | Aceitável. Se quiser, avisar o usuário ou tentar revogar de novo |
| R4 | **`JSON.parse(localStorage.getItem("user"))` sem `try/catch`** (`src/contexts/AuthContext.tsx:41`) | Valor corrompido ou storage bloqueado (modo anônimo restrito) **derruba o app inteiro** na abertura. Contraria a regra do próprio projeto | Envolver em `try/catch` e tratar como sem usuário |
| R5 | Nome e e-mail do usuário em `localStorage` (sem token) | Baixo: legível por qualquer script da página | Manter, mas não guardar nada além disso |
| R6 | `dev-dist/` (service worker gerado) versionado | Ruído no código e risco de publicar artefato de dev | `git rm -r --cached dev-dist` + `.gitignore` |

---

## 3. Bugs corrigidos

| # | Bug na base | Sintoma para o usuário | Correção |
|---|---|---|---|
| B1 | **Filtro de período deslocado em 3h.** `toUTCISOString` subtraía o fuso e chamava `toISOString()`, mandando o horário local com "Z" | Movimentações do começo ou do fim do dia sumiam ou apareciam no período errado | `paraIsoUtc` em `utils/formatacao.ts`, usado em cadastro, conclusão e filtros (`parametrosApi`) |
| B2 | **Agendadas com `- 3 * 60 * 60 * 1000` fixo** | Horários errados fora do fuso de Brasília ou com mudança de fuso | Centralizado em `paraHorarioBrasilia`. O módulo está desativado nesta versão |
| B3 | **Respostas antigas sobrescreviam as novas.** Trocar o filtro rápido fazia a resposta lenta chegar por último | A tabela mostrava o período anterior | Contador em `useRef` na tela da conta e no `useBuscaApi`: resposta velha é ignorada |
| B4 | **Lista vazia = 404 da API.** A tela só atualizava `if (sucesso && dados)` | O item recém-excluído (último da lista) continuava na tela | `useBuscaApi` trata 404 como lista vazia e limpa os dados em qualquer falha |
| B5 | **Servidor offline: `erro` vinha `undefined`.** O login fazia `if (resposta.erro)` e seguia para `resposta!.dados!.token` | Tela travada ou erro genérico sem explicação | `Conecta` sempre preenche `erro` (mensagem do axios ou "Falha na comunicação com o servidor"). Telas checam `!resposta.sucesso` |
| B6 | **Navegação por estado (`telaAtual` 0–7) dentro do `/home`** | F5 voltava para Contas; não dava para abrir em nova guia, favoritar nem compartilhar link | Rotas reais (`/`, `/:idConta/contabancaria`, `/:idConta/dashboard`), filtros na URL e links de verdade |
| B7 | **Refresh ao abrir o app dependia do hash da URL** (`estaNaTelaDeLogin`) | Sessão às vezes não era restaurada ao abrir direto uma rota | Restauração pelo `user` salvo. Sem usuário, não tenta e não gera 401 desnecessário |
| B8 | **Saldo não atualizava após cadastrar** (já tratado em `63ab34c` na base; aqui sem rebuscar tudo) | — | Depois do cadastro, só a conta é rebuscada. A movimentação entra na tabela se passar nos filtros |
| B9 | **Digitar data pela metade** (ex.: ano "0202") | A data era "corrigida" no meio da digitação e virava outro ano | `CampoDataHora` só salva com o ano completo (≥ 1000) e dentro dos limites |
| B10 | **Período sem limites** | Datas absurdas quebravam a busca | No máximo 100 anos e cada data a no máximo 100 anos de hoje. Valor inválido na URL volta ao padrão |
| B11 | **Tooltip dos gráficos longe do mouse** (`backdrop-filter`) | Valor exibido no lugar errado | Tooltip renderizado no `document.body` |
| B12 | **Cores verde/vermelho nos gráficos** | Ilegível para daltônicos | Azul/laranja, validadas nos dois modos |
| B13 | **Contraste de chips de categoria** | Texto apagado em cores saturadas | `coresChipCategoria` (branco a partir de 3:1) e paleta de categorias com texto ≥ 4.5:1, com teste em script |
| B14 | **Lançamentos em lote duplicavam ao reenviar** (novo fluxo) | — | Repetição mensal e transferência continuam da que falhou (`useRef`), sem duplicar |

### Bugs mantidos de propósito
- `ResumoContas.saudacao`: a condição `hora >= 22 && hora <= 3` nunca é verdadeira (decisão do usuário).

---

## 4. Outras mudanças estruturais

- **Roteamento:** `HashRouter` + `base: "/financproject/"` → `BrowserRouter` na raiz. O deploy no GitHub Pages em `/financproject/` deixou de funcionar e precisa de domínio próprio.
- **Contextos removidos:** `ConviteContext` e `MovimentacaoContext`. Os dados de formulário vão por props, e o estado global ficou só no `ContaContext`.
- **UI:** os componentes próprios (`FncButton`, `InputText`, `FncTable`, `TitleText`…) foram trocados por MUI 9. Entraram `@mui/x-charts`, `@mui/x-date-pickers` e `dayjs`; saiu a dependência inválida `axion`.
- **Telas viraram painéis:** Membros, Convites e Usuário. Agendadas foi desativada.
- **Testes de lógica pura** em `scripts/` (período, filtros na URL, ordem, preferências da tabela, cor de categoria, agrupamento).

---

## 5. Prioridade sugerida (backlog)

1. **R4:** `try/catch` no `JSON.parse` do usuário. É uma linha e evita o app inteiro quebrar.
2. **R2:** separar a URL da API de dev e de produção.
3. **R1:** guard nas rotas logadas.
4. **R6:** tirar `dev-dist/` do git.
5. Definir domínio de produção e o cookie `SameSite=None; Secure; Partitioned` no back-end.
