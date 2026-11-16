# FinancHub (financproject)

Front-end de gestão financeira pessoal: React 19 + Vite 8 + TypeScript, com MUI 9 (`@mui/material`, `@mui/icons-material`, Emotion). Back-end .NET separado (não está neste repositório) em `https://localhost:7147/api`.

## Comandos

- `npm run dev` — servidor de desenvolvimento (o Vite faz proxy de `/api` para o back-end).
- `npm run build` — `tsc -b` + `vite build` + copia `dist/index.html` para `dist/404.html` (fallback de rotas no GitHub Pages).
- `npx tsc -b --noEmit` — checagem de tipos. Rode antes de dar algo por pronto.
- `npm run lint` — ESLint. Há erros antigos nas telas ainda não migradas; não introduza novos.

## Direção do projeto

**Estamos migrando dos componentes feitos à mão com CSS próprio para o MUI, tela por tela.** Ao mexer numa tela:

- Use componentes do MUI (`Box`, `Stack`, `Typography`, `Button`, `Card`, `Drawer`, `Menu`, `Alert`, `Tooltip`…) em vez dos antigos de `src/props/` (`TitleText`, `SubtitleText`, `LabelText`, `FncButton`, `ErrorText`, `InputText`, `InputTextAndColor`, `MsgBox`, `Modal`…).
- Apague o CSS que ficar sem uso. Classe usada por um só componente fica no CSS dele; só vai para `src/index.css` se mais de um componente usar.
- No MUI 9 não existem mais props de estilo soltas no `Stack`/`Box` (ex.: `alignItems`); use `sx`.
- Prefira cores do tema (`"primary.main"`, `"text.secondary"`, `"divider"`, `"background.paper"`) ou da paleta (`src/cores.ts`). Nada de hex solto em componente novo.

Telas **já migradas**: Login, Registrar, Inicial (resumo + cards de conta + gaveta de nova conta), barra lateral, carregamento.
Telas **ainda no CSS antigo** (sempre escuras): Movimentações, Agendadas, Membros, Configurações da conta (`EditaConta`), Convites, Opções de usuário, Categorias.

## Estrutura

```
src/
  App.tsx                 rotas + ThemeProvider (tema escuro padrão)
  tema.ts                 criarTema(modo) e `tema` (escuro); overrides de Button, TextField, Checkbox
  cores.ts                paletas CoresEscuro / CoresClaro (fonte única das cores)
  componentes/            peças de layout reutilizáveis
    layout-principal/     barra lateral + <Outlet/> das telas logadas; ExigeConta
    layout-autenticacao/  página de login/cadastro (CSS próprio com variáveis --fnc-login-*)
    formulario-autenticacao/  <form> com erro geral e botão de envio
    barra-lateral/        menu (MUI Drawer), menu do usuário no rodapé
    carregamento/         tela de carregamento (sem fundo próprio, logo clara)
  hooks/                  useEnvioFormulario, useModoCor, useValoresOcultos
  props/                  componentes de formulário
    campo-texto/          CampoTexto (TextField padrão) + validacoes.ts
    seletor-cor/          SeletorCor (cores prontas + personalizada)
    input-check-box/      InputCheckBox (por dentro é Checkbox do MUI)
    …                     demais componentes antigos (a migrar)
  services/
    api/api.ts            axios + token + interceptors de 401/refresh
    api/apiConnect.ts     Conecta<T>(rota, metodo, corpo) -> ApiResult<T> (nunca lança erro)
    auth/tokenService.ts  autenticar()
    usuario/usuarioService.ts  registrarUsuario()
  telas/                  uma pasta por tela (kebab-case), arquivo em PascalCase
  utils/formatacao.ts     formatarMoeda, exibirMoeda(valor, oculto)
```

Convenções: pastas em kebab-case, componentes em PascalCase, nomes e comentários em **português**. Comentário só para o "porquê".

## Rotas (BrowserRouter, sem prefixo `/financproject`)

| Rota | Tela | Observação |
|---|---|---|
| `/login` | Login | redireciona para `/inicial` se já houver usuário |
| `/registrar` | Registrar | |
| `/inicial` | Inicial (antiga Home/Contas) | dentro do `LayoutPrincipal` |
| `/convites`, `/usuario` | Convites, OpcoesUsuario | dentro do `LayoutPrincipal` |
| `/movimentacoes`, `/agendadas`, `/membros`, `/configuracoes-conta` | telas da conta | exigem conta selecionada (`ExigeConta`); sem conta voltam para `/inicial` |
| `*` | → `/login` | |

A conta selecionada (`ContaContext`) fica só em memória: recarregar uma rota da conta volta para `/inicial`. As rotas logadas **não** são protegidas contra acesso sem sessão (pendência).

## API e autenticação

- `services/api/api.ts` guarda o access token fora do React e coloca `Authorization: Bearer` em toda requisição.
- Em **401**: chama `POST /Autenticacao/refresh` (cookie httpOnly `refreshToken`) **uma vez**, compartilhada entre requisições simultâneas, e repete a original. Se o refresh falhar, `AuthContext` faz logout e navega para `/login`. O refresh usa uma instância axios sem interceptors.
- `Conecta` devolve `{ sucesso, dados?, erro?, status? }`; quando o servidor não responde, `erro` vem com a mensagem do axios. Verifique `!resposta.sucesso`, não só `resposta.erro`.
- Em dev, `baseURL` é `/api` (proxy do Vite, cookie first-party). No build, `https://localhost:7147/api` — ainda não há URL de produção. Em produção cross-site o back-end precisa marcar o cookie como `SameSite=None; Secure; Partitioned`.

## Tema, cores e modo claro/escuro

- `src/cores.ts`: `Paleta` com `primaria`, `secundaria`, `fundo`, `borda`, `texto`, `barraLateral` (cores próprias da barra) e `login` (variáveis `--fnc-login-*` do `LayoutAutenticacao.css`). `Cores` = paleta escura (para o que ainda é só escuro).
- Cor primária: `#155dfc`. Itens selecionados, botões de ação e o card de resumo usam a primária **sólida** (o degradê só sobrou no botão padrão do tema).
- Modo claro/escuro: `useModoCor` (chave `modoCor`; sem escolha salva, segue o sistema). O `LayoutPrincipal` controla o modo; o botão fica no menu do usuário da barra lateral.
  - Só as rotas em `ROTAS_COM_MODO_CLARO` (`LayoutPrincipal.tsx`, hoje só `/inicial`) recebem o tema claro; as demais ficam no escuro até migrarem.
  - A área central usa o **mesmo fundo do login**: cor `login.pagina` + marca d'água (`.fnc-fundo-marca` em `index.css`), com texto claro nos dois modos.
  - Barra lateral: azul-marinho `#061a5c` no modo claro, `#0f172b` no escuro. A gaveta de nova conta usa as mesmas cores e o **tema escuro** do MUI (fundo escuro nos dois modos).
- Logos em `src/assets/`: `pldprojects-logo-clara.svg` (barra lateral, sobre fundo primário), `pldprojects-logo-azul-clara.svg` (toda branca, no carregamento), `pldprojects-logo-azul.svg` (login no modo claro), `pldprojects-marca-dagua.svg` (fundo). A logo da barra sobe 10% (`translateY(-10%)`) porque o desenho pesa embaixo.
- Bordas arredondadas com fundo: use `backgroundClip: "padding-box"` (ou fundo e borda no mesmo elemento) para evitar serrilhado nos cantos — foi o caso dos campos de texto e da logo.

## Componentes-chave

- **CampoTexto** (`props/campo-texto`): `TextField` com `valor`/`setValor`, `validar(valor) => string | null` e `mostrarErro` (o erro só aparece depois de tentar enviar). Com `type="password"` ganha o botão de olho.
- **useEnvioFormulario(acao)**: controla `enviando`, `erro` e `tentouEnviar`; a ação devolve a mensagem de erro geral ou nada.
- **SeletorCor** (`props/seletor-cor`): 12 cores prontas + personalizada (input nativo escondido); acessível como `radiogroup`.
- **Inicial** (`telas/inicial`):
  - `ResumoContas`: card na cor primária com saudação, "Minhas Contas", botão de olho (oculta valores), "Nova conta bancária", patrimônio total, projetado, receitas e despesas.
  - `ContaComponent` (`contas-bancarias/componente/conta-unitaria`): MUI `Card` na cor da conta; nome ao lado do ícone; "não contabilizado" é o ícone `money_off` com tooltip; saldo à esquerda e receitas/despesas empilhadas à direita (`Indicador`). Grade com mínimo de 320px (`.grid-contas`).
  - Cards **arrastáveis** (HTML5 drag and drop nativo) — ordem em `ordemContas.ts` (funções puras) + `useOrdemContas.ts`.
  - Menu de 3 pontos no card (só contas ativas): favoritar, somar saldo e editar nome/cor (só admin; a permissão é buscada ao abrir o menu). Após alterar, `Inicial` rebusca as contas e chama `contasAlteradas()` do `ContaContext`, que faz a barra lateral rebuscar os favoritos.
  - `CadContas`: `Drawer` da direita com prévia do card, nome e `SeletorCor`. Com a prop `conta` edita (PATCH `Contas/{id}/atualiza`); sem ela cadastra.

## localStorage

| Chave | Conteúdo |
|---|---|
| `user` | usuário logado (`AuthContext`) |
| `modoCor` | `"claro"` / `"escuro"` |
| `valoresOcultos` | `"true"` / `"false"` |
| `ordemContas:<idUsuario>` | ids das contas na ordem escolhida |

`logout()` chama `localStorage.clear()` (pedido do usuário), então **todas** essas preferências somem ao deslogar. Leituras e escritas ficam em `try/catch` (aba anônima pode bloquear).

## Pendências conhecidas

- Proteger as rotas logadas (redirecionar para `/login` sem sessão).
- Ordem das contas e preferências só no navegador; para valer entre dispositivos o back-end precisa guardar a posição.
- Arrastar cards não funciona com toque nem teclado (considerar `@dnd-kit` se for necessário).
- `ResumoContas.saudacao`: `hora >= 22 && hora <= 3` nunca é verdadeiro (mantido de propósito; decisão do usuário).
- Confirmação de "Sair da Conta" ainda usa `MsgBox` antigo.
- `dev-dist/` é gerado pelo `npm run dev`; considerar colocar no `.gitignore`.
- Deploy: sem o `base` do Vite, o GitHub Pages em `/financproject/` não funciona; precisa de domínio próprio/raiz.
- Lint antigo: `setState` dentro de `useEffect` na Inicial e `any` em telas não migradas.

## Como verificar mudanças

Não há testes automatizados. Para lógica pura (ex.: `ordemContas.ts`, validações) escreva um script com `node:assert` fora do `src/`. Telas logadas precisam do back-end rodando; sem ele, valide com `tsc` + `vite build` e diga que o visual não foi conferido.
