# FinancHub (financproject)

Front-end de gestão financeira pessoal: React 19 + Vite 8 + TypeScript, com MUI 9 (`@mui/material`, `@mui/icons-material`, Emotion). Back-end .NET separado (não está neste repositório) em `https://localhost:7147/api`.

## Comandos

- `npm run dev` — servidor de desenvolvimento (o Vite faz proxy de `/api` para o back-end).
- `npm run build` — `tsc -b` + `vite build` + copia `dist/index.html` para `dist/404.html` (fallback de rotas no GitHub Pages).
- `npx tsc -b --noEmit` — checagem de tipos. Rode antes de dar algo por pronto.
- `npm run lint` — ESLint. Passa sem erros: mantenha assim.
  - Busca ao abrir a tela: chame a API com `.then(...)` dentro do `useEffect` (a regra `set-state-in-effect` não aceita `async/await` direto no efeito). Formulário de edição dentro de gaveta: inicie o `useState` com os dados em vez de copiar num efeito (a gaveta remonta o conteúdo a cada abertura).
  - As funções do `ContaContext` são estáveis (`useMemo`); podem ir nas dependências sem causar loop.

## Direção do projeto

**Estamos migrando dos componentes feitos à mão com CSS próprio para o MUI, tela por tela.** Ao mexer numa tela:

- Use componentes do MUI (`Box`, `Stack`, `Typography`, `Button`, `Card`, `Drawer`, `Menu`, `Alert`, `Tooltip`…). Os antigos de texto (`TitleText`, `SubtitleText`, `LabelText`, `ErrorText`, `MsgTextBox`) foram removidos: título de tela é `TituloPagina`, título de gaveta é o `titulo` do `Modal`, erro é `<Alert severity="error">`.
- Algo repetido em mais de um lugar vira componente, hook ou utilitário (ver Estrutura). Nomes em português (props inclusive: `rotulo`, `valor`/`setValor`, `aberto`); `onClose`/`onClick` seguem a convenção do React/MUI.
- Apague o CSS que ficar sem uso. Classe usada por um só componente fica no CSS dele; só vai para `src/index.css` se mais de um componente usar.
- No MUI 9 não existem mais props de estilo soltas no `Stack`/`Box` (ex.: `alignItems`); use `sx`.
- Prefira cores do tema (`"primary.main"`, `"text.secondary"`, `"divider"`, `"background.paper"`) ou da paleta (`src/cores.ts`). Nada de hex solto em componente novo.

Telas **já migradas**: Login, Registrar, Inicial (resumo + cards de conta + gaveta de nova conta), barra lateral, carregamento, Categorias (gaveta), Movimentações, Membros, Convites (ainda sempre escura).
Telas **com CSS antigo, mas seguindo o modo claro/escuro** (variáveis `--fnc-*`): Agendadas (`MovimentacaoFixa.css`: seções `.mf-*`). No modo claro, as seções usam a cor primária sólida com texto branco; os campos são do MUI e seguem o tema.
Telas **ainda no CSS antigo** (sempre escuras): Opções de usuário (só o cartão; erros e sucesso já são `Alert`).
Campos: sempre `CampoTexto` (ou `CampoDataHora` para data). `InputPrice` (`valor: number`/`setValor`; zerado fica vazio), `InputSelect` (`CampoTexto` com `select`; opções `{ rotulo, valor }`), `InputCheckBox` (`rotulo`/`marcado`/`setMarcado`) e `CheckBoxList` (`CampoTexto` só leitura + `Popover` com busca e `Checkbox`; `chaveId`/`chaveTexto`/`setSelecionados`) usam componentes do MUI por dentro. Não crie `<input>`/`<select>` nativos com CSS próprio.

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
    titulo-pagina/        TituloPagina (h1 das telas logadas + subtítulo opcional)
    aviso-atualizacao/    AvisoAtualizacao (PWA: offline pronto / nova versão; Snackbar)
  estilos.ts              sx compartilhados (estiloBotaoSecundario)
  hooks/                  useEnvioFormulario, useModoCor, useValoresOcultos, useCategorias(idConta)
  props/                  componentes de formulário
    campo-texto/          CampoTexto (TextField padrão) + validacoes.ts
    campo-expiracao/      CampoExpiracao (checkbox "Tempo de expiração" + minutos; convite e membro)
    seletor-cor/          SeletorCor (cores prontas + personalizada)
    seletor-tipo-movimentacao/  Receita/Despesa (ToggleButtonGroup; valor = TIPO_MOVIMENTACAO)
    input-check-box/      InputCheckBox (por dentro é Checkbox do MUI)
    …                     InputPrice, InputSelect, CheckBoxList, CampoDataHora, MsgBox
  services/
    api/api.ts            axios + token + interceptors de 401/refresh
    api/apiConnect.ts     Conecta<T>(rota, metodo, corpo) -> ApiResult<T> (nunca lança erro; importe como `Conecta`)
    auth/tokenService.ts  autenticar()
    usuario/usuarioService.ts  registrarUsuario()
    contas/contaUsuarioService.ts  buscarContaUsuario(idConta, idUsuario) (permissão do usuário na conta)
    movimentacoes/movimentacaoService.ts  materializarMovimentacao, alterarCategoriasMovimentacao, mesmasCategorias
  telas/                  uma pasta por tela (kebab-case), arquivo em PascalCase
  utils/formatacao.ts     formatarMoeda, exibirMoeda, valorComSinal, dataHoraLocal, paraIsoUtc, periodoDoMes, formatarDataHora, iniciais
  utils/permissao.ts      PERMISSAO (Mestre 0, Administrador 1, Visualizador 2), nomePermissao, OPCOES_PERMISSAO
```

Convenções: pastas em kebab-case, componentes em PascalCase, nomes e comentários em **português**. Comentário só para o "porquê".

## Rotas (BrowserRouter, sem prefixo `/financproject`)

| Rota | Tela | Observação |
|---|---|---|
| `/login` | Login | redireciona para `/inicial` se já houver usuário |
| `/registrar` | Registrar | |
| `/inicial` | Inicial (antiga Home/Contas) | dentro do `LayoutPrincipal` |
| `/convites`, `/usuario` | Convites, OpcoesUsuario | dentro do `LayoutPrincipal` |
| `/:idConta/contabancaria` | Movimentacoes | `ContaDaRota` busca a conta pelo id da URL (recarregar funciona); inexistente/inativa/sem acesso volta para `/inicial` |
| `/agendadas`, `/membros` | telas da conta | exigem conta selecionada (`ExigeConta`); sem conta voltam para `/inicial` |
| `*` | → `/login` | |

A conta selecionada (`ContaContext`) fica só em memória: recarregar uma rota da conta volta para `/inicial`. As rotas logadas **não** são protegidas contra acesso sem sessão (pendência).

## API e autenticação

- `services/api/api.ts` guarda o access token fora do React e coloca `Authorization: Bearer` em toda requisição.
- Em **401**: chama `POST /Autenticacao/refresh` (cookie httpOnly `refreshToken`) **uma vez**, compartilhada entre requisições simultâneas, e repete a original. Se o refresh falhar, `AuthContext` faz logout e navega para `/login`. O refresh usa uma instância axios sem interceptors.
- `Conecta` devolve `{ sucesso, dados?, erro?, status? }`; quando o servidor não responde, `erro` vem com a mensagem do axios. Verifique `!resposta.sucesso`, não só `resposta.erro`.
- Em dev, `baseURL` é `/api` (proxy do Vite, cookie first-party). No build, `https://localhost:7147/api` — ainda não há URL de produção. Em produção cross-site o back-end precisa marcar o cookie como `SameSite=None; Secure; Partitioned`.

## Tema, cores e modo claro/escuro

- `src/cores.ts`: `Paleta` com `primaria`, `secundaria`, `fundo`, `borda`, `texto`, `barraLateral` (cores próprias da barra) e `login` (variáveis `--fnc-login-*` do `LayoutAutenticacao.css`). `Cores` = paleta escura (para o que ainda é só escuro).
- Cor primária: `#155dfc`. Itens selecionados, botões de ação e o card de resumo usam a primária **sólida**; não há mais degradê (o `Button` `contained` usa a primária do tema).
- Modo claro/escuro: `useModoCor` (chave `modoCor`; sem escolha salva, segue o sistema). O `LayoutPrincipal` controla o modo; o botão fica no menu do usuário da barra lateral.
  - Só as rotas de `temModoClaro` (`LayoutPrincipal.tsx`: `/inicial`, `/:idConta/contabancaria`, `/agendadas`, `/membros`) recebem o tema claro; as demais ficam no escuro até migrarem.
  - Componentes antigos com CSS próprio usam variáveis `--fnc-*` geradas de `paleta.telas` (`variaveisTelas` em `cores.ts`), aplicadas no `<main>` (paleta do modo) e na gaveta `Modal` (paleta do modo, como a barra). `--fnc-texto`/`--fnc-apoio` são para o que fica sobre o fundo azul da página; cards, tabelas e listas redefinem as duas para `--fnc-texto-superficie`/`--fnc-apoio-superficie` no próprio CSS. O label do `TextField` e do checkbox também lê `--fnc-apoio`. Não use hex nesses CSS.
  - Fundo da área central: `telas.pagina` + marca d'água (`.fnc-fundo-marca` em `index.css`). No escuro, igual ao login (`#030a1f`, marca branca, texto claro); no claro, **branco gelo** (`#eaf0f7`, os cards brancos se destacam) com a marca azul-escura (`.fnc-fundo-marca--escura`) e `--fnc-texto`/`--fnc-apoio` escuros (cards e tabelas continuam azuis com texto branco). O fundo fica no invólucro `.area-central`; em `/inicial` e `/:idConta/contabancaria` o `<main>` ganha `.fundo-desfocado` (`backdrop-filter: blur(12px)`), que desfoca só o fundo, não o conteúdo.
  - Barra lateral: **branca** no modo claro em todas as telas (`BarraLateralClara` em `cores.ts`), `#0f172b` no escuro. A gaveta `Modal` segue a barra: no claro, `BarraLateralClara` + tema claro + `variaveisTelas(CoresClaro)`; no escuro, `CoresEscuro.barraLateral` + tema escuro.
- Logos em `src/assets/`: `pldprojects-logo-clara.svg` (login no escuro); na barra lateral só o SVG, sem quadro: `pldprojects-logo-azul.svg` no claro e `pldprojects-logo-azul-clara.svg` no escuro, `pldprojects-logo-azul-clara.svg` (toda branca, no carregamento sobre fundo escuro), `pldprojects-logo-azul.svg` (login e carregamento no modo claro; também a marca d'água do fundo claro, a 7% via `::before`), `pldprojects-marca-dagua.svg` (marca d'água do fundo escuro). A logo da barra sobe 10% (`translateY(-10%)`) porque o desenho pesa embaixo.
- Bordas arredondadas com fundo: use `backgroundClip: "padding-box"` (ou fundo e borda no mesmo elemento) para evitar serrilhado nos cantos — foi o caso dos campos de texto e da logo.

## Componentes-chave

- **Modal** (`componentes/modal`): todo modal de formulário é a gaveta MUI da direita (`Drawer`, 450px, cores e modo da barra lateral), com `aberto`, botão de fechar e `titulo` opcional (o título do formulário vai aqui, não dentro dele). Não crie overlays próprios. O conteúdo ainda renderiza durante a animação de fechar: guarde o item editado até lá (ex.: `gaveta = { aberta, membro }` em Membros).
- **MsgBox** (`props/msg-box`): `tipo="aviso"` (Ok) ou `"pergunta"` (Sim/Não) num `Dialog` do MUI; `aoResponder(sim)`; fechar sem responder = "Não".
- **Estado entre telas**: só a conta selecionada e o vínculo do usuário com ela ficam em contexto (`ContaContext`). Dados de um formulário (movimentação editada, membro, convite) vão por props.

- **CampoTexto** (`props/campo-texto`): `TextField` com `valor`/`setValor`, `validar(valor) => string | null` e `mostrarErro` (o erro só aparece depois de tentar enviar). Com `type="password"` ganha o botão de olho.
- **CampoDataHora** (`props/campo-data-hora`): `DateTimePicker` do MUI X (`@mui/x-date-pickers` + `dayjs`, `LocalizationProvider` pt-BR no `App.tsx`). Valor em `FORMATO_DATA_HORA` (`utils/formatacao.ts`, "YYYY-MM-DDTHH:mm"). O visual vem de `MuiPickersOutlinedInput` no `tema.ts`, que compartilha `estiloCampo` com o `MuiOutlinedInput`.
- **Tela da conta / Transações** (`telas/movimentacoes`, layout "Azul claro"): cores em `paleta.transacoes` (`cores.ts`), variáveis `--fnc-tx-*`. No `<main>` a classe `.pagina-transacoes` põe a camada `--fnc-tx-overlay` **por cima** do fundo com marca d'água — não troque o fundo. Hoje ela é `transparent` nos dois modos: a logo da marca d'água tem de aparecer no claro como no escuro (a 85% ela sumia). O card da tabela é vidro fosco (superfície 55% via `color-mix` + `backdrop-filter`). No modo claro a barra lateral usa `BarraLateralClara` (branca) em todas as telas: só cores mudam, nunca o layout da barra. Cards em `CardResumo`; filtros (chips `ChipFiltro`/`ChipSelect`, `CheckBoxList` com `gatilho`) vão na `barra` do `TabelaDados`.
- **FiltroPeriodo** (`telas/movimentacoes/filtro-periodo`): "[Data inicial] [Data final] [‹|›]" na barra da tabela, em grade: as duas datas em colunas `1fr` (sempre a mesma largura); no celular uma por linha, setas ao lado da final. Os campos são `CampoDataHora` (a final não fica antes da inicial) e as setas levam o período ao mês inteiro anterior/seguinte (dia 1 00:00 até o último dia 23:59).
- Chips de categoria: `coresChipCategoria` (`utils/corCategoria.ts`) escurece o texto até 4.5:1 sobre o fundo suave; testado por `scripts/testa-cor-categoria.ts`.
- **TabelaDados** (`componentes/tabela-dados`): `Table` do MUI genérica usada em todas as tabelas (Movimentações, Convites, Membros, Agendadas). Colunas `{titulo, chave, exibir?, ordenarPor?, oculta?, alinhar?}`; cores pelas variáveis `--fnc-*` (via `sx`) para seguir o modo da tela. Opcionais: `barra` (conteúdo à esquerda dos botões de colunas), `estilos` (`sx` somado em `barra`/`container`/`tabela`) e `ordenacaoPadrao` (vale só sem preferências salvas, como `oculta`).
  - Ordenação clicando no cabeçalho (asc → desc → original; vazios sempre no fim); colunas reordenáveis arrastando o cabeçalho ou pelas setas do menu "Colunas" (acessível por teclado), que também liga/desliga colunas (a última visível não some).
  - Com `idPreferencias`, o botão "Salvar" grava ordem, colunas ocultas e ordenação em `tabela:<id>`. Lógica pura em `preferenciasTabela.ts`, testada por `scripts/testa-preferencias-tabela.ts` (`node --experimental-strip-types`).
- **TabelaMovimentacao** (`telas/movimentacoes/tabela`): `TabelaDados` com as colunas da movimentação (chips de categoria, valor colorido); clicar na linha abre `ConclusaoMovimentacao` num `Dialog` do MUI (concluir/extornar, deletar, alterar); "Alterar" abre o `CadMov` na gaveta `Modal` com a prop `movimentacao` (sem ela, o `CadMov` cadastra). Movimentação virtual (id 0, de agendamento) é materializada antes de concluir/deletar/editar (`materializarMovimentacao`).
- **useEnvioFormulario(acao)**: controla `enviando`, `erro` e `tentouEnviar`; a ação devolve a mensagem de erro geral ou nada.
- **TabelaPesquisa** (`componentes/tabela-pesquisa`): `Paper` com pesquisa (`InputBase`, ignora maiúsculas e acentos) e `Table` de uma coluna no mesmo contorno; linha clicável com `onSelecionar`. Usada em Categorias.
- **SeletorCor** (`props/seletor-cor`): 12 cores prontas + personalizada (input nativo escondido); acessível como `radiogroup`.
- **Inicial** (`telas/inicial`):
  - Layout "G · Cards brancos": cores `--fnc-tx-*` (as mesmas da tela da conta), direto sobre o fundo da página (sem camada por cima).
  - `ResumoContas`: saudação + primeiro nome, "Minhas contas", botão de olho 44×44 e "Nova conta bancária"; abaixo um card branco com 4 colunas (patrimônio com "n de total contas no total", projetado com selo se negativo, receitas e despesas pendentes). Divisórias por `box-shadow` de 1px cortadas pelo `overflow: hidden` do card, para funcionar com 4, 2 ou 1 coluna.
  - `CardConta` (`contas-bancarias/card-conta`): card branco com faixa de 4px e avatar (iniciais) na cor da conta, escurecida por `corParaTextoBranco` (`utils/corCategoria.ts`) até 4.5:1 com o branco; "Corrente · Favorita · Fora do total"; blocos ↑ Receitas / ↓ Despesas (neutros quando zerados ou com valores ocultos). Grade `.grid-contas` (auto-fill, mínimo 260px) termina no card tracejado "Adicionar conta".
  - Cards **arrastáveis** (HTML5 drag and drop nativo) — ordem em `ordemContas.ts` (funções puras) + `useOrdemContas.ts`.
  - Menu de 3 pontos no card (só contas ativas): favoritar, somar saldo, editar nome/cor (só admin; a permissão é buscada ao abrir o menu) e sair da conta (confirmação em `Dialog` do MUI; POST `ContasUsuarios/{id}/sair`). Após alterar, `Inicial` rebusca as contas e chama `contasAlteradas()` do `ContaContext`, que faz a barra lateral rebuscar os favoritos.
  - `CadContas`: `Drawer` da direita com prévia do card, nome e `SeletorCor`. Com a prop `conta` edita (PATCH `Contas/{id}/atualiza`); sem ela cadastra.

## localStorage

| Chave | Conteúdo |
|---|---|
| `user` | usuário logado (`AuthContext`) |
| `modoCor` | `"claro"` / `"escuro"` |
| `valoresOcultos` | `"true"` / `"false"` |
| `ordemContas:<idUsuario>` | ids das contas na ordem escolhida |
| `tabela:<id>` | `{ ordem, ocultas, ordenacao }` de cada `TabelaDados` (ids: `movimentacoes`, `movimentacoes-fixas`, `membros`, `convites-recebidos`, `convites-enviados`) |

`logout()` chama `localStorage.clear()` (pedido do usuário), então **todas** essas preferências somem ao deslogar. Leituras e escritas ficam em `try/catch` (aba anônima pode bloquear).

## Pendências conhecidas

- Proteger as rotas logadas (redirecionar para `/login` sem sessão).
- Ordem das contas e preferências só no navegador; para valer entre dispositivos o back-end precisa guardar a posição.
- Arrastar cards não funciona com toque nem teclado (considerar `@dnd-kit` se for necessário).
- `ResumoContas.saudacao`: `hora >= 22 && hora <= 3` nunca é verdadeiro (mantido de propósito; decisão do usuário).
- `dev-dist/` é gerado pelo `npm run dev` e está commitado; já fica fora do lint, mas vale tirar do git (`git rm -r --cached dev-dist` + `.gitignore`).
- Deploy: sem o `base` do Vite, o GitHub Pages em `/financproject/` não funciona; precisa de domínio próprio/raiz.

## Como verificar mudanças

Não há testes automatizados. Para lógica pura (ex.: `ordemContas.ts`, validações) escreva um script com `node:assert` fora do `src/` (como `scripts/testa-formatacao.ts`, `testa-preferencias-tabela.ts`, `testa-cor-categoria.ts`; rode com `node --experimental-strip-types`). Telas logadas precisam do back-end rodando; sem ele, valide com `tsc` + `vite build` e diga que o visual não foi conferido.
