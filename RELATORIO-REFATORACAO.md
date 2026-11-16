# Relatório da refatoração — FinancHub (front-end)

**Data:** 16/11/2026
**Escopo:** análise de todo o `src/` para remover código e CSS sem uso, transformar duplicações em componentes, hooks ou utilitários, aplicar o padrão do projeto (migração para MUI, clean code) e padronizar os nomes em português.

**Verificação:** `npx tsc -b --noEmit`, `npm run lint` e `npm run build` passam sem erros. Os scripts `scripts/testa-formatacao.ts` (novo), `testa-preferencias-tabela.ts` e `testa-cor-categoria.ts` também passam.
**Não verificado:** o visual das telas logadas e as chamadas reais à API, porque dependem do back-end rodando.

---

## Resumo em números

| | Antes | Depois |
|---|---|---|
| Linhas de código (ts/tsx/css em `src`) | 9.678 | 8.362 (−14%) |
| Arquivos CSS | 20 | 7 |
| Contextos globais | 4 | 2 |
| `Movimentacoes.tsx` | 765 | 611 |
| `MovimentacaoFixa.tsx` | 674 | 446 |
| `CadMov.tsx` | 337 | 208 |
| `ConclusaoMovimentacao.tsx` | 284 | 192 |
| `Convites.tsx` | 318 | 189 |
| `Membros.tsx` | 168 | 123 |

---

## 1. Código sem uso removido

### Componentes
- `props/input-text-and-color/` (`InputTextAndColor`): nenhuma tela usava.
- `props/input-color/` (`InputColor`): só o componente acima usava.
- `props/msg-box/TypeMsgBox.tsx`: substituído pela prop `tipo: "aviso" | "pergunta"`.

### CSS
- `telas/movimentacoes/cad-convite/CadConviteStyle.css` (vazio).
- `.modal-body` e `.categoria` (`CadMovStyle.css`).
- `.fnc-login-remember` e seus filhos (`LayoutAutenticacao.css`).
- A regra `body` duplicada em `LayoutPrincipal.css` foi juntada à de `index.css`.
- A regra `.pagina-central::-webkit-scrollbar`, idêntica à global.

### Variáveis CSS geradas e nunca lidas
- `--fnc-borda`, `--fnc-positivo`, `--fnc-negativo` e `--fnc-neutro`: chaves removidas de `CoresTelas` nas duas paletas (`cores.ts`).

### Assets e arquivos soltos
- `src/assets/pldprojects-logo-nome-azul.png` e `pldprojects-logo-nome-clara.svg`.
- `BrowserRouter` e `autenticar` na raiz: arquivos vazios, criados por engano.
- `package.zip` e `src/index.zip`: backups que estavam commitados (continuam no histórico do git).

### Tipos, exports e funções
- `CategoriaPost` e `DashboardResponse` (com seus tipos internos).
- O tipo `Categoria`, que estava definido duas vezes. Agora existe só em `models/categorias` e é reexportado em `GetMovimentacoes`.
- `export const Cores` (`cores.ts`).
- `removeMovimentacao`, `removeMembroConta` e `removeContaUsuario` (contextos).
- 5 `console.log` de depuração.

---

## 2. Duplicações transformadas em código compartilhado

| Criado | Onde estava repetido |
|---|---|
| `utils/formatacao.ts`: `dataHoraLocal`, `periodoDoMes`, `paraIsoUtc`, `formatarDataHora`, `iniciais`; `formatarMoeda` passou a aceitar valor ausente | 5 cópias de "data → `YYYY-MM-DDTHH:mm`", 3 de "início/fim do mês", 6 de `Intl.NumberFormat` em BRL, 3 de "dd/mm/aaaa hh:mm", 2 de iniciais (barra lateral e card de conta) |
| `utils/permissao.ts`: `PERMISSAO`, `nomePermissao`, `OPCOES_PERMISSAO` | `typePermission`/`nivelAcesso` em 3 telas, a lista de opções de permissão em 2 formulários e números soltos (`=== 0`, `!== 2`) |
| `hooks/useCategorias(idConta)` | a busca de categorias em Movimentações, Agendadas, CadMov e Categorias |
| `services/movimentacoes/movimentacaoService.ts`: `materializarMovimentacao`, `alterarCategoriasMovimentacao`, `mesmasCategorias` | a materialização de agendada (CadMov e Conclusão) e a troca de categorias com comparação (CadMov e Agendadas) |
| `services/contas/contaUsuarioService.ts`: `buscarContaUsuario` | a busca da permissão do usuário na conta (Movimentações e card de conta) |
| `props/seletor-tipo-movimentacao/SeletorTipoMovimentacao` (MUI `ToggleButtonGroup`) | os botões Receita/Despesa nativos com CSS e hex próprios (CadMov e Agendadas) |
| `props/campo-expiracao/CampoExpiracao` | o checkbox "Tempo de expiração" + campo de minutos (CadConvite e EditMembro) |
| `componentes/titulo-pagina/TituloPagina` | o `Typography` h1 copiado em Movimentações e Inicial, mais o `TitleText` das outras telas |
| `estilos.ts`: `estiloBotaoSecundario` | o mesmo `sx` de botão em Movimentações e no resumo da Inicial |
| `componentes/aviso-atualizacao/AvisoAtualizacao` (Snackbar + Alert do MUI) | o `ReloadPrompt` com botões nativos e CSS próprio |

### Repetições dentro das próprias telas
- **Movimentações:**
  - Os 4 cards de "Ver detalhes" viraram um `CardDetalhe` alimentado por uma lista de dados.
  - Os 3 valores do rodapé viraram `ValorRodape`.
  - As 2 grades de cards usam um único `sx`.
  - A chave dos filtros, antes calculada duas vezes, agora é calculada uma vez.
  - Os filtros Status e Tipo guardam o valor direto, sem as conversões em cadeia de antes.
- **Agendadas:**
  - 4 blocos de requisição quase iguais (cadastro/edição × mensal/semanal) e 6 cópias do tratamento de erro viraram um único fluxo.
  - Os mapas de dias da semana e de meses passaram a ser derivados de listas.
  - As 3 funções de formatar data viraram uma.
- **Convites:**
  - O mapeamento de recebidos e enviados virou uma única função.
  - Os dois modais idênticos viraram um, configurado pela ação.
  - As duas buscas rodam em paralelo (`Promise.all`).
- **Conclusão de movimentação:** "concluir/extornar" e "deletar" compartilham a função `executar`.

---

## 3. Padrão do projeto aplicado

### Migração para MUI
- Componentes apagados: `TitleText`, `ErrorText`, `LabelText`, `SubtitleText`, `MsgTextBox` e `InputDate`.
- Substitutos: `TituloPagina`, `<Alert severity="error">`, o `titulo` do `Modal`, `Alert severity="warning"` e `CampoDataHora`.
- CSS apagado por ter sido trocado por `Stack`/`Box`: `MembrosStyle.css`, `EditMembro.css`, `ConvitesStyle.css`, `CadMovStyle.css` e `ReloadPrompt.css`.
- Em Opções de usuário, os erros e o aviso de sucesso viraram `Alert`, e a validação passou a usar `validar`/`mostrarErro` do `CampoTexto`. Isso eliminou 4 estados de erro.

### Estado
- `MovimentacaoContext` e `ConviteContext` foram removidos. Os dados vão por props (`CadMov` recebe `movimentacao`) ou ficam em estado local (Convites).
- O `membro` saiu do `ContaContext` e virou prop do `EditMembro`.
- O `ContaContext` ficou só com a conta selecionada, o vínculo do usuário com ela, `limparConta` e `contasAlteradas`.

### Formulários
- Todos usam `useEnvioFormulario`, em que a ação devolve a mensagem de erro.
- Os `try/catch` em volta do `Conecta` foram removidos: ele nunca lança erro.
- As buscas ao abrir a tela seguem o padrão `useCallback` + `.then` no `useEffect`, sem `eslint-disable`.

### Nomes em português

| Antes | Depois |
|---|---|
| `Modal isOpen` | `aberto` |
| `MsgBox title/description/type/centerlize/onQuestion` | `titulo/descricao/tipo/centralizar/aoResponder` |
| `InputCheckBox label/checked/setChecked` | `rotulo/marcado/setMarcado` |
| `InputSelect label/value/onChange`, opções `{label, value}` | `rotulo/valor/setValor`, opções `{rotulo, valor}` (também no `ChipSelect`) |
| `InputPrice formattedValue/setFormattedValue/setValue` | `valor/setValor` (o estado do texto formatado saiu de quem chama) |
| `CheckBoxList idKey/labelKey/onChange/label` | `chaveId/chaveTexto/setSelecionados/rotulo` |
| `CampoDataHora label` | `rotulo` |
| `ContaComponent` (`componente/conta-unitaria`) | `CardConta` (`card-conta`) |
| `ReloadPrompt` | `AvisoAtualizacao` |
| `removeConta` | `limparConta` |
| `import api from ".../apiConnect"` | `import Conecta` |
| `isLoading`, `handleRowClick`, `getNow`, `isMobile`, `loading`, `setcontasObtidas`… | `enviando`, `editar`, `periodoDoMes`, `ehCelular`, `carregando`, `setContasObtidas`… |

`onClose` e `onClick` foram mantidos por serem a convenção do React/MUI.

### Documentação
- `CLAUDE.md` atualizado: estrutura, componentes, APIs dos campos, telas migradas e scripts de verificação.

---

## 4. Mudanças de comportamento a conferir

### Bugs corrigidos
- No cadastro de transação, os botões Receita/Despesa podiam ficar travados por uma movimentação concluída que sobrava no contexto global.
- Na edição de transação, `catMov.sort()` e `categoriasSelecionadas.sort()` alteravam o próprio estado. Agora a comparação usa cópias.
- Se a expulsão de um membro falhava, o código seguia em silêncio para "alterar usuário". Agora a mensagem de erro aparece.

### Visual
- Datas em Nova/Editar transação e em Agendadas usam o seletor do MUI (`CampoDataHora`) no lugar do campo nativo `datetime-local`.
- Receita/Despesa agora são `ToggleButton`, nas cores `--fnc-tx-receita`/`--fnc-tx-despesa`.
- Os títulos de Agendadas, Membros e Convites ficaram alinhados à esquerda, com peso 700 (antes 800 e centralizados).
- Os títulos dos formulários foram para o cabeçalho da gaveta.
- As tabelas de Convites passam a empilhar abaixo de 1200px (antes 1300px).
- Em Membros, a data perdeu a vírgula: "16/11/2026 14:30".

### Pioras pequenas
- Em Agendadas, uma mensagem de erro continua visível ao clicar em outra linha. Antes ela era limpa.
- No modal de Convites, o conteúdo some durante a animação de fechar.

---

## 5. Pendências (fora do escopo desta rodada)

- **Nomes que ficaram em inglês:**
  - `user`, `login`, `logout` e `tokenData` do `AuthContext`: aparecem em quase todas as telas.
  - Os nomes dos models (`GetMovimentacoes`, `usarioCriador`…), que espelham o JSON da API.
- **CSS antigo com hex:** `OpcoesUsuarioStyle.css`, `MovimentacaoFixa.css` e `LayoutAutenticacao.css`. Neste último, as variáveis `--fnc-login-*` são montadas à mão em vez de usar a função `variaveis()` de `cores.ts`.
- **Fusos horários:** os dois tratamentos abaixo foram mantidos como estavam. Parecem compensar o back-end e precisam ser revistos com a API rodando.
  - Em Agendadas, as datas são corrigidas com −3h fixas.
  - Em Transações, o filtro envia a hora local como se fosse UTC (`paraUtcSemFuso`).
- **Confirmação duplicada:** o `CardConta` ainda tem um diálogo "Sair da conta" próprio, que repete o `MsgBox` do tipo pergunta (só os textos dos botões mudam).
- **Documentação divergente:** o `CLAUDE.md` diz que o back-end fica em `localhost:7147`, mas `api.ts` aponta para `https://api.pldprojects.com.br/api`.
- **Commit:** nada foi commitado. As remoções já estão no índice (`git rm`), e os arquivos novos ainda não foram adicionados.
