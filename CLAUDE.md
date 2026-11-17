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

Telas **já migradas**: Login, Registrar, Inicial (resumo + cards de conta + gaveta de nova conta), barra lateral, carregamento, Categorias (gaveta), Movimentações, painéis de membros, de usuário, de convites e de agendadas. Não há mais telas com CSS próprio de cores fixas (sobram `LayoutPrincipal.css`, `Inicial.css`, `MovimentacaoesStyle.css` e o do login).
Campos: sempre `CampoTexto` (ou `CampoDataHora` para data). `InputPrice` (`valor: number`/`setValor`; zerado fica vazio), `InputSelect` (`CampoTexto` com `select`; opções `{ rotulo, valor }`), `InputCheckBox` (`rotulo`/`marcado`/`setMarcado`) e `CheckBoxList` (`CampoTexto` só leitura + `Popover` com busca e `Checkbox`; `chaveId`/`chaveTexto`/`setSelecionados`) usam componentes do MUI por dentro. Não crie `<input>`/`<select>` nativos com CSS próprio.

## Estrutura

```
src/
  App.tsx                 rotas + ThemeProvider (tema escuro padrão)
  tema.ts                 criarTema(modo) e `tema` (escuro); overrides de Button, TextField, Checkbox
  cores.ts                paletas CoresEscuro / CoresClaro (fonte única das cores)
  componentes/            peças de layout reutilizáveis
    layout-principal/     barra lateral + <Outlet/> das telas logadas; ContaDaRota
    layout-autenticacao/  página de login/cadastro (CSS próprio com variáveis --fnc-login-*)
    formulario-autenticacao/  <form> com erro geral e botão de envio
    barra-lateral/        menu (MUI Drawer): Contas, conta atual (só na tela da conta, `/:idConta/contabancaria`) com subtópicos (Dashboard; Agendadas e Membros da conta abrem painéis; fechados, a seta ao lado abre; ao entrar em `/:idConta/contabancaria` abrem e fecham sozinhos em 3s, a menos que o usuário clique na seta ou num subtópico), no fim do menu, a versão (à esquerda) e, só na tela da conta, "Sair da conta" abaixo dela, Convites (abre o painel), "Última acessada" (fora das telas da conta: atalho para a última conta aberta, `useUltimaConta`; some se a conta não estiver mais ativa para o usuário), Favoritos; menu do usuário no rodapé
    carregamento/         tela de carregamento (sem fundo próprio, logo clara)
    titulo-pagina/        TituloPagina (h1 das telas logadas + subtítulo opcional)
    aviso-atualizacao/    AvisoAtualizacao (PWA: offline pronto / nova versão; Snackbar)
    painel-lateral/       PainelLateral + CabecalhoPainel + EstadoLista + DetalhePainel (esqueleto dos subpainéis ao lado da barra lateral)
    chip-categoria/       ChipCategoria (categoria na cor da API)
    lista-pesquisa/       ListaPesquisa (lista clicável com pesquisa)
    titulo-secao/         TituloSecao (título em caixa alta: seções do menu, tópicos, partes de formulário)
    painel-membros/       PainelMembros (membros da conta) + EditMembro
    painel-usuario/       PainelUsuario (opções do usuário: alterar senha)
    painel-convites/      PainelConvites (convites recebidos e enviados) + CadConvite (formulário; também usado pelo "Novo convite" da tela da conta, com a conta já escolhida)
    painel-agendadas/     PainelAgendadas (tabela, 920px) + FormularioAgendada (gaveta) + agendadas.ts (tipos e datas)
  estilos.ts              sx compartilhados (estiloBotaoSecundario)
  hooks/                  useBuscaApi(rota) (GET com dados/erro/carregando/buscar: use em toda busca ao abrir), useEnvioFormulario, useModoCor, useValoresOcultos, useCategorias(idConta), useCoresBarra(), useUltimaConta(idUsuario, idContaAberta), useContasMestre() (contas em que o usuário é mestre: 1 requisição de permissão por conta, porque a lista não traz a permissão)
  props/                  componentes de formulário
    campo-texto/          CampoTexto (TextField padrão) + validacoes.ts
    campo-expiracao/      CampoExpiracao (checkbox "Tempo de expiração" + minutos; convite e membro)
    seletor-cor/          SeletorCor (cores prontas + personalizada)
    seletor-conta/        SeletorConta (escolha de conta bancária com a cor dela)
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
  utils/formatacao.ts     formatarMoeda, exibirMoeda, valorComSinal, dataHoraLocal, paraIsoUtc, periodoDoMes, formatarDataHora, iniciais, normalizarNome (comparar/pesquisar nomes sem acento, maiúscula e espaços nas pontas)
  utils/permissao.ts      PERMISSAO (Mestre 0, Administrador 1, Visualizador 2), nomePermissao, OPCOES_PERMISSAO
```

Convenções: pastas em kebab-case, componentes em PascalCase, nomes e comentários em **português**. Comentário só para o "porquê".

## Rotas (BrowserRouter, sem prefixo `/financproject`)

| Rota | Tela | Observação |
|---|---|---|
| `/login` | Login | redireciona para `/` se já houver usuário |
| `/registrar` | Registrar | |
| `/` | Inicial (antiga Home/Contas) | dentro do `LayoutPrincipal`; o endereço antigo `/inicial` redireciona para cá |
| `/:idConta/dashboard` | Dashboard | gráficos da conta; mesmos filtros na URL da tela de transações (período, categorias, status, tipo: `useFiltrosUrl` + `ChipsFiltros`) e **o mesmo GET** da tabela (`rotaMovimentacoes(idConta, filtros)` em `filtrosUrl.ts`, sem filtro extra no cliente); os links da conta e do Dashboard na barra levam os filtros da URL junto (`manterFiltros`); com Tipo = Entrada/Saída só a pizza e a linha daquele tipo aparecem; subtópico "Dashboard" da conta na barra |
| `/:idConta/contabancaria` | Movimentacoes | `ContaDaRota` busca a conta pelo id da URL (recarregar funciona); inexistente/inativa/sem acesso volta para `/` |
| `*` | → `/login` | |

A conta selecionada (`ContaContext`) fica só em memória: a tela da conta busca pela URL (`ContaDaRota`), então recarregar funciona. As rotas logadas **não** são protegidas contra acesso sem sessão (pendência).

## API e autenticação

- `services/api/api.ts` guarda o access token fora do React e coloca `Authorization: Bearer` em toda requisição.
- Em **401**: chama `POST /Autenticacao/refresh` (cookie httpOnly `refreshToken`) **uma vez**, compartilhada entre requisições simultâneas, e repete a original. Se o refresh falhar, `AuthContext` faz logout e navega para `/login`. O refresh usa uma instância axios sem interceptors.
- `Conecta` devolve `{ sucesso, dados?, erro?, status? }`; quando o servidor não responde, `erro` vem com a mensagem do axios. Verifique `!resposta.sucesso`, não só `resposta.erro`.
- Datas: envie sempre UTC de verdade com `paraIsoUtc` (cadastro, conclusão, agendadas **e filtros**, via `parametrosApi`). Os filtros mandavam o horário local com "Z" (deslocava o período 3h).
- Lista vazia: a API responde **404** com mensagem ("Nenhum convite foi encontrado!") em vez de `[]`. O `useBuscaApi` trata 404 como lista vazia (sem erro) e, em qualquer falha, limpa os dados anteriores (senão o item recém-removido continuava na tela).
- Em dev, `baseURL` é `/api` (proxy do Vite, cookie first-party). No build, `https://localhost:7147/api` — ainda não há URL de produção. Em produção cross-site o back-end precisa marcar o cookie como `SameSite=None; Secure; Partitioned`.

## Tema, cores e modo claro/escuro

- `src/cores.ts`: `Paleta` com `primaria`, `secundaria`, `fundo`, `borda`, `texto`, `barraLateral` (cores próprias da barra) e `login` (variáveis `--fnc-login-*` do `LayoutAutenticacao.css`). `Cores` = paleta escura (para o que ainda é só escuro).
- Cor primária: `#155dfc`. Itens selecionados, botões de ação e o card de resumo usam a primária **sólida**; não há mais degradê (o `Button` `contained` usa a primária do tema).
- Modo claro/escuro: `useModoCor` (chave `modoCor`; sem escolha salva, segue o sistema). O `LayoutPrincipal` controla o modo; o botão fica no menu do usuário da barra lateral.
  - Só as rotas de `telaDeCards` (`LayoutPrincipal.tsx`: `/` e `/:idConta/contabancaria`) recebem o tema claro (e o fundo desfocado); os painéis e a gaveta seguem o modo em qualquer tela; as demais ficam no escuro até migrarem.
  - Componentes antigos com CSS próprio usam variáveis `--fnc-*` geradas de `paleta.telas` (`variaveisTelas` em `cores.ts`), aplicadas no `<main>` (paleta do modo) e na gaveta `Modal` (paleta do modo, como a barra). `--fnc-texto`/`--fnc-apoio` são para o que fica sobre o fundo azul da página; cards, tabelas e listas redefinem as duas para `--fnc-texto-superficie`/`--fnc-apoio-superficie` no próprio CSS. O label do `TextField` e do checkbox também lê `--fnc-apoio`. Não use hex nesses CSS.
  - Fundo da área central: `telas.pagina` + marca d'água (`.fnc-fundo-marca` em `index.css`). No escuro, igual ao login (`#030a1f`, marca branca, texto claro); no claro, **branco gelo** (`#eaf0f7`, os cards brancos se destacam) com a marca azul-escura (`.fnc-fundo-marca--escura`) e `--fnc-texto`/`--fnc-apoio` escuros (cards e tabelas continuam azuis com texto branco). O fundo fica no invólucro `.area-central`; em `/` e `/:idConta/contabancaria` o `<main>` ganha `.fundo-desfocado` (`backdrop-filter: blur(12px)`), que desfoca só o fundo, não o conteúdo.
  - Barra lateral: **branca** no modo claro em todas as telas (`BarraLateralClara` em `cores.ts`), `#0f172b` no escuro. A gaveta `Modal` segue a barra: no claro, `BarraLateralClara` + tema claro + `variaveisTelas(CoresClaro)`; no escuro, `CoresEscuro.barraLateral` + tema escuro.
- Logos em `src/assets/`: `pldprojects-logo-clara.svg` (login no escuro); na barra lateral só o SVG, sem quadro: `pldprojects-logo-azul.svg` no claro e `pldprojects-logo-azul-clara.svg` no escuro, `pldprojects-logo-azul-clara.svg` (toda branca, no carregamento sobre fundo escuro), `pldprojects-logo-azul.svg` (login e carregamento no modo claro; também a marca d'água do fundo claro, a 7% via `::before`), `pldprojects-marca-dagua.svg` (marca d'água do fundo escuro). A logo da barra sobe 10% (`translateY(-10%)`) porque o desenho pesa embaixo.
- Bordas arredondadas com fundo: use `backgroundClip: "padding-box"` (ou fundo e borda no mesmo elemento) para evitar serrilhado nos cantos — foi o caso dos campos de texto e da logo.

## Componentes-chave

- **Modal** (`componentes/modal`): todo modal de formulário é a gaveta MUI da direita (`Drawer`, 450px, cores e modo da barra lateral), com `aberto`, botão de fechar e `titulo` opcional (o título do formulário vai aqui, não dentro dele). Não crie overlays próprios. O conteúdo ainda renderiza durante a animação de fechar: guarde o item editado até lá (ex.: o `EditMembro` guarda o último membro exibido).
- **MsgBox** (`props/msg-box`): `tipo="aviso"` (Ok) ou `"pergunta"` (Sim/Não) num `Dialog` do MUI; `aoResponder(sim)`; fechar sem responder = "Não".
- **Estado entre telas**: só a conta selecionada e o vínculo do usuário com ela ficam em contexto (`ContaContext`). Dados de um formulário (movimentação editada, membro, convite) vão por props.
- **PainelLateral** (`componentes/painel-lateral`): esqueleto dos subpainéis colados à barra lateral (`Drawer` `persistent`, 340px ou `largura`, sem passar da tela; `deslocamento` = largura da barra; no celular ocupa a tela), com `CabecalhoPainel` (avatar, título, subtítulo, `onAtualizar` desenha o botão de atualizar, fechar), `EstadoLista` (erro, carregando e lista vazia) e `DetalhePainel` (ícone + texto nas linhas). Sem fundo escuro: a barra continua clicável; fecha no X, com Esc ou navegando pelo menu (`irPara`). O conteúdo desmonta ao fechar (`unmountOnExit`). Cores da barra (`useCoresBarra()` / `coresDaBarra(claro)` em `cores.ts`, também usadas pela barra e pelo `Modal`). A barra tem **um** `PainelLateral` e troca o conteúdo pela tabela `PAINEIS` em `BarraLateral.tsx` (`rotulo`, `Conteudo`, `daConta`, `largura`); cada painel exporta só o conteúdo (`React.FC<{ onClose }>`). Painel novo: um arquivo com o conteúdo + uma entrada em `PAINEIS` + o botão que chama `alternarPainel`.
- **PainelUsuario** (`componentes/painel-usuario`): "Opções de usuário" no menu do usuário abre este painel (substituiu a antiga tela `/usuario`): nome e e-mail no cabeçalho e as opções separadas por tópico (`Topico`, com `TituloSecao`). Cada opção é uma `OpcaoExpansivel` (ícone, título, descrição; expande o conteúdo abaixo, uma por vez). Tópico **Segurança** → "Alterar senha" (`FormularioSenha`: validação nos campos; depois de alterar, revoga a sessão e vai para `/login`). Opção nova: acrescente ao tipo `Opcao` e a um tópico.
- **PainelAgendadas** (`componentes/painel-agendadas`): o subtópico "Agendadas" da conta abre este painel largo (`largura` 920 no `PainelLateral`, limitado à tela), que substituiu a antiga tela `/agendadas`. Tabela (`TabelaDados`, preferências em `movimentacoes-fixas`) com "Nova agendada"; clicar numa linha edita. O formulário (`FormularioAgendada`, só MUI) abre na gaveta `Modal`: recorrência (por enquanto só mensal), datas, tipo, título, valor, observação, categorias; na edição, Excluir. As datas das agendadas vêm 3h à frente da API (`paraHorarioBrasilia`).
- **PainelConvites** (`componentes/painel-convites`): "Convites" no menu da barra abre este painel (substituiu a antiga tela `/convites`). Abas Recebidos (com a contagem de pendentes) e Enviados; cada convite é uma linha (iniciais da conta, de/para, acesso, situação, datas). Ações só enquanto pendente: Aceitar (direto), Recusar e Revogar (confirmam com `MsgBox`). Depois de responder, `contasAlteradas()` e rebusca. No rodapé, "Convidar membro" (só se o usuário for mestre de alguma conta, `useContasMestre`) abre o `CadConvite` na gaveta `Modal`, com o `SeletorConta` para escolher a conta; depois de enviar, mostra a aba Enviados atualizada.
- **PainelMembros** (`componentes/painel-membros`): o subtópico "Membros da conta" (abaixo da conta atual no menu da barra lateral) abre/fecha este painel; vale com qualquer conta selecionada. Lista os membros (`useBuscaApi`, o próprio usuário primeiro com "(você)") com ícones Material Icons de acesso (`workspace_premium`/`admin_panel_settings`/`visibility`), inativo (`block`) e expiração (`schedule`); o mestre edita os outros (`edit`) pela gaveta `EditMembro`, menos outros mestres. Convidar fica no painel de convites. O conteúdo só monta com o painel aberto (`unmountOnExit`), então a busca acontece ao abrir. Substituiu a antiga página `/membros` (removida).
- **EditMembro** (`componentes/painel-membros`): já inclui a gaveta `Modal` (como o `CadContas`): `membro` (null = fechada), `onClose`, `onAlterado`. Aberto pelo painel de membros.

- **CampoTexto** (`props/campo-texto`): `TextField` com `valor`/`setValor`, `validar(valor) => string | null` e `mostrarErro` (o erro só aparece depois de tentar enviar). Com `type="password"` ganha o botão de olho.
- **CampoDataHora** (`props/campo-data-hora`): `DateTimePicker` do MUI X (`@mui/x-date-pickers` + `dayjs`, `LocalizationProvider` pt-BR no `App.tsx`). Valor em `FORMATO_DATA_HORA` (`utils/formatacao.ts`, "YYYY-MM-DDTHH:mm"). O visual vem de `MuiPickersOutlinedInput` no `tema.ts`, que compartilha `estiloCampo` com o `MuiOutlinedInput`.
- **Tela da conta / Transações** (`telas/movimentacoes`, layout "Azul claro"): cores em `paleta.transacoes` (`cores.ts`), variáveis `--fnc-tx-*`. No `<main>` a classe `.pagina-transacoes` põe a camada `--fnc-tx-overlay` **por cima** do fundo com marca d'água — não troque o fundo. Hoje ela é `transparent` nos dois modos: a logo da marca d'água tem de aparecer no claro como no escuro (a 85% ela sumia). O card da tabela é vidro fosco (superfície 55% via `color-mix` + `backdrop-filter`). No modo claro a barra lateral usa `BarraLateralClara` (branca) em todas as telas: só cores mudam, nunca o layout da barra. Cards em `CardResumo`; filtros (chips `ChipFiltro`/`ChipSelect`, `CheckBoxList` com `gatilho`) vão na `barra` do `TabelaDados`; `ChipFiltro` com `onLimpar` mostra um X (o de Categorias limpa todas).
- **FiltroPeriodo** (`telas/movimentacoes/filtro-periodo`): "[Data inicial] [Data final] [‹|›]" na barra da tabela, em grade: as duas datas em colunas `1fr` (sempre a mesma largura); no celular uma por linha, setas ao lado da final. As datas editadas são um rascunho: só pesquisam no botão "Pesquisar" (ou Enter; destacado quando há mudança), não a cada tecla; o rascunho acompanha quando o período muda por fora (setas, URL). Os campos são `CampoDataHora` (a final não fica antes da inicial) e as setas (que já pesquisam) levam o período ao mês inteiro anterior/seguinte (dia 1 00:00 até o último dia 23:59). Muda as duas datas numa chamada só (`setPeriodo(inicio, fim)`).
- **Filtros na URL** (`telas/movimentacoes/filtrosUrl.ts`): período, categorias, status e tipo da tela da conta vivem em `?inicio=&fim=&categorias=1,2&status=pendente|concluido&tipo=entrada|saida` (`useSearchParams`, `replace`), não em `useState`. Valor padrão (mês atual, "todas") fica fora da URL; valor inválido editado à mão volta ao padrão. Funções puras `lerFiltros`/`paraParametros`/`parametrosApi` (query da API, com `RetornaFixos`), testadas por `scripts/testa-filtros-url.ts`. Nas duas telas da conta, use o hook `useFiltrosUrl()` (`{ filtros, alterarFiltros }`) e os chips `ChipsFiltros` (Categorias + Status + Tipo; `filtros/ChipsFiltros.tsx`). Mude vários filtros num único `alterarFiltros({...})`: duas escritas seguidas na URL perdem a primeira.
- **Dashboard** (`telas/dashboard`): card de vidro fosco com o gráfico "Entradas e saídas" (embaixo, largura toda, 260px; `LineChart` ou `BarChart` do `@mui/x-charts` pelo botão Linhas/Barras no card, mesmas `series`/`propsGrafico`, eixo X `point` ou `band`, **um eixo Y à esquerda**, mesma escala para as duas séries; marcadores só até 31 pontos). `agruparPorPeriodo` (`agrupamento.ts`, testado por `scripts/testa-agrupamento.ts`) soma por dia até 62 dias e por mês acima disso, com os vazios zerados. Cores das séries `transacoes.graficoEntrada`/`graficoSaida` em hex pelo `useCoresGrafico` (modo do tema da página; não use `var(--fnc-tx-*)` em cor de série: o tooltip fica no body, sem as variáveis, e o marcador saía preto) (azul/laranja, validadas para daltonismo nos dois modos; verde/vermelho falhava). Em cima, uma por linha na largura toda (240px de altura), duas roscas `PizzaCategorias` (`PieChart`; o botão Pizza/Linhas troca por um `LineChart` com uma linha por categoria no período, `agruparCategoriasPorPeriodo`): "Saídas por categoria" e "Entradas por categoria", uma fatia por categoria na cor dela (a dos chips), total no topo, % ao lado do nome na legenda e no tooltip ("Mercado 42%"; fatia que arredonda para 0% não aparece, mas conta no total) e dentro das fatias ≥ 25°; `agruparPorCategoria` conta o valor inteiro de uma movimentação em cada categoria dela (como o filtro de categoria da tela da conta; decisão do usuário), então as fatias podem somar mais que o total; o total do topo e as % usam o total real do tipo. Os cards são **arrastáveis** (HTML5 drag and drop, como os cards de conta; ícone `drag_indicator` no título) e a ordem fica em `ordemDashboard:<idUsuario>`; com o filtro de tipo, o gráfico escondido mantém o lugar. Os dois ficam no `CardGrafico` e trocam de formato pelo `SeletorFormato` (botões de ícone; mesmo arquivo). Tooltip dos gráficos no `document.body` (`TOOLTIP_NO_BODY`): ele é `position: fixed` e o `backdrop-filter` do card/`<main>` deslocava o valor para longe do mouse. Respeita os valores ocultos. `ehTelaDaConta` (`utils/rotas.ts`) vale para `/contabancaria` e `/dashboard` (barra lateral e tema claro).
- **Cadastro sem nova busca**: o `CadMov` devolve a movimentação criada (`onClose(cadastrada)`, lida de `{ valor }` na resposta do POST) e a tela a inclui na tabela só se `passaNosFiltros` (período, tipo, status, categorias). Sem id na resposta, busca na API como antes. Saldos e cards de resumo só atualizam pelo botão "Recarregar" (flecha redonda na barra da tabela), que busca conta, permissões, categorias e movimentações e mostra o carregamento da tabela.
- Chips de categoria: sempre `ChipCategoria` (`componentes/chip-categoria`; tabela, lista e prévia de Categorias). Cores por `coresChipCategoria` (`utils/corCategoria.ts`) fundo na cor exata da API (sem clarear) e texto branco (preto só em cores claras: branco a partir de 3:1, porque o preto fica apagado em tons saturados; rótulo em negrito 600); testado por `scripts/testa-cor-categoria.ts`.
- **TabelaDados** (`componentes/tabela-dados`): `Table` do MUI genérica usada nas tabelas de Movimentações e do painel de Agendadas (este passa `estilos` com cores do tema MUI, porque o painel fica fora da área central e não tem as variáveis `--fnc-*`). Colunas `{titulo, chave, exibir?, ordenarPor?, oculta?, alinhar?}`; cores pelas variáveis `--fnc-*` (via `sx`) para seguir o modo da tela. Opcionais: `barra` (conteúdo à esquerda dos botões de colunas), `estilos` (`sx` somado em `barra`/`container`/`tabela`) e `ordenacaoPadrao` (vale só sem preferências salvas, como `oculta`).
  - Ordenação clicando no cabeçalho (asc → desc → original; vazios sempre no fim); colunas reordenáveis arrastando o cabeçalho ou pelas setas do menu "Colunas" (acessível por teclado), que também liga/desliga colunas (a última visível não some) e tem "Redefinir colunas" (volta à ordem definida pela tela e mostra todas as colunas, inclusive as `oculta` por padrão; "Salvar" grava).
  - Com `idPreferencias`, o botão "Salvar" grava ordem, colunas ocultas e ordenação em `tabela:<id>`. Lógica pura em `preferenciasTabela.ts`, testada por `scripts/testa-preferencias-tabela.ts` (`node --experimental-strip-types`).
- **TabelaMovimentacao** (`telas/movimentacoes/tabela`): `TabelaDados` com as colunas da movimentação (chips de categoria, valor colorido); clicar na linha abre `ConclusaoMovimentacao` num `Dialog` do MUI (concluir/extornar, deletar, alterar); "Alterar" abre o `CadMov` na gaveta `Modal` com a prop `movimentacao` (sem ela, o `CadMov` cadastra). Movimentação virtual (id 0, de agendamento) é materializada antes de concluir/deletar/editar (`materializarMovimentacao`).
- **useEnvioFormulario(acao)**: controla `enviando`, `erro` e `tentouEnviar`; a ação devolve a mensagem de erro geral ou nada.
- **ListaPesquisa** (`componentes/lista-pesquisa`): `Paper` com pesquisa (`CampoTexto`, ignora maiúsculas e acentos), contagem ("n itens" / "n de total") e `List` clicável no mesmo contorno; `item(item, selecionado)` desenha a linha, `onSelecionar`. Usada na gaveta de Categorias (chip da categoria + ícone editar/check).
- **Categorias** (`telas/categorias`, gaveta "Categorias" da tela da conta): sem abas. "+ Nova" abre o `NovaCategoriaForm` (card no topo: prévia em `ChipCategoria`, nome com aviso de repetido via `normalizarNome`, máx. 40, paleta fechada `CORES_CATEGORIA` (`utils/corCategoria.ts`: 10 tons escuros, texto branco ≥ 4.5:1, testada; `SeletorCor personalizada={false}`, também na edição), começa na primeira cor ainda não usada; Enter cria, Esc fecha só o card). Depois de criar, a nova fica destacada na lista (achada pelo nome: o POST não devolve id). Clicar numa categoria da lista abre a edição abaixo dela.
- **SeletorCor** (`props/seletor-cor`): 12 cores prontas + personalizada (input nativo escondido); acessível como `radiogroup`.
- **Inicial** (`telas/inicial`):
  - Layout "G · Cards brancos": cores `--fnc-tx-*` (as mesmas da tela da conta), direto sobre o fundo da página (sem camada por cima).
  - `ResumoContas`: saudação + primeiro nome, "Minhas contas", botão de olho 44×44 e "Nova conta bancária"; abaixo um card branco com 4 colunas (patrimônio com "n de total contas no total", projetado com selo se negativo, receitas e despesas pendentes). Divisórias por `box-shadow` de 1px cortadas pelo `overflow: hidden` do card, para funcionar com 4, 2 ou 1 coluna.
  - `CardConta` (`contas-bancarias/card-conta`): card branco com faixa de 4px e avatar (iniciais) na cor da conta, escurecida por `corParaTextoBranco` (`utils/corCategoria.ts`) até 4.5:1 com o branco; "Corrente · Favorita"; ícone `money_off` (com tooltip) ao lado de "Saldo" quando a conta não soma no total; blocos ↑ Receitas / ↓ Despesas (neutros quando zerados ou com valores ocultos). Grade `.grid-contas` (auto-fill, mínimo 260px) termina no card tracejado "Adicionar conta".
  - Cards **arrastáveis** (HTML5 drag and drop nativo) — ordem em `utils/ordem.ts` (`ordenarPorIds`/`moverId`, ids número ou texto; testadas por `scripts/testa-ordem.ts`) + `hooks/useOrdemSalva(chave)` (localStorage). Os gráficos do dashboard usam os mesmos.
  - Menu de 3 pontos no card (só contas ativas): favoritar, somar saldo, editar nome/cor (só admin; a permissão é buscada ao abrir o menu) e sair da conta (confirmação em `Dialog` do MUI; POST `ContasUsuarios/{id}/sair`). Após alterar, `Inicial` rebusca as contas e chama `contasAlteradas()` do `ContaContext`, que faz a barra lateral rebuscar os favoritos.
  - `CadContas`: `Drawer` da direita com prévia do card, nome e `SeletorCor`. Com a prop `conta` edita (PATCH `Contas/{id}/atualiza`); sem ela cadastra.

## localStorage

| Chave | Conteúdo |
|---|---|
| `user` | usuário logado (`AuthContext`) |
| `modoCor` | `"claro"` / `"escuro"` |
| `valoresOcultos` | `"true"` / `"false"` |
| `ordemContas:<idUsuario>` | ids das contas na ordem escolhida |
| `ordemDashboard:<idUsuario>` | ordem dos gráficos do dashboard (`saidas`, `entradas`, `entradas-saidas`) |
| `ultimaConta:<idUsuario>` | id da última conta bancária aberta (seção "Última acessada" da barra) |
| `tabela:<id>` | `{ ordem, ocultas, ordenacao }` de cada `TabelaDados` (ids: `movimentacoes`, `movimentacoes-fixas`) |

`logout()` chama `localStorage.clear()` (pedido do usuário), então **todas** essas preferências somem ao deslogar. Leituras e escritas ficam em `try/catch` (aba anônima pode bloquear).

## Pendências conhecidas

- Proteger as rotas logadas (redirecionar para `/login` sem sessão).
- Ordem das contas e preferências só no navegador; para valer entre dispositivos o back-end precisa guardar a posição.
- Arrastar cards não funciona com toque nem teclado (considerar `@dnd-kit` se for necessário).
- `ResumoContas.saudacao`: `hora >= 22 && hora <= 3` nunca é verdadeiro (mantido de propósito; decisão do usuário).
- `dev-dist/` é gerado pelo `npm run dev` e está commitado; já fica fora do lint, mas vale tirar do git (`git rm -r --cached dev-dist` + `.gitignore`).
- Deploy: sem o `base` do Vite, o GitHub Pages em `/financproject/` não funciona; precisa de domínio próprio/raiz.

## Como verificar mudanças

Não há testes automatizados. Para lógica pura (ex.: `utils/ordem.ts`, validações) escreva um script com `node:assert` fora do `src/` (como `scripts/testa-formatacao.ts`, `testa-filtros-url.ts`, `testa-preferencias-tabela.ts`, `testa-cor-categoria.ts`; rode com `node --experimental-strip-types`). Telas logadas precisam do back-end rodando; sem ele, valide com `tsc` + `vite build` e diga que o visual não foi conferido.
