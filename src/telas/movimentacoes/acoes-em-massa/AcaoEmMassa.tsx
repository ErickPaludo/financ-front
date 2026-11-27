import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Icon,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

import type {
  Categoria,
  Movimentacao,
} from "../../../models/movimentacoes/GetMovimentacoes";
import {
  alterarCategorias,
  alterarDataMovimentacao,
  alterarValorMovimentacao,
  concluirMovimentacao,
  extornarMovimentacao,
  mesmasCategorias,
  removerMovimentacao,
} from "../../../services/movimentacoes/movimentacaoService";
import InputCheckBox from "../../../props/input-check-box/InputCheckBox";
import CampoDataHora from "../../../props/campo-data-hora/CampoDataHora";
import CheckBoxList from "../../../props/check-box-list/CheckBoxList";
import InputSelect from "../../../props/input-select/InputSelect";
import InputPrice from "../../../props/input-price/InputPrice";
import { useCategorias } from "../../../hooks/useCategorias";
import {
  categoriasResultantes,
  OPCOES_MODO_CATEGORIAS,
  type ModoCategorias,
} from "./categoriasEmMassa";
import {
  dataHoraLocal,
  formatarData,
  formatarDataHora,
  formatarMoeda,
  paraIsoUtc,
} from "../../../utils/formatacao";
import MsgBox from "../../../props/msg-box/MsgBox";
import { useFiltrosUrl } from "../useFiltrosUrl";
import {
  comDia,
  OPCOES_DIA,
  OPCOES_MODO_DATA,
  type ModoData,
} from "./dataEmMassa";

export type TipoAcaoEmMassa =
  | "concluir"
  | "extornar"
  | "excluir"
  | "data"
  | "valor"
  | "categorias";

// textos de cada ação; "feitas" completa "N de M ..."
const TEXTOS: Record<
  TipoAcaoEmMassa,
  { verbo: string; andamento: string; feitas: string; falhou: string }
> = {
  concluir: {
    verbo: "Concluir",
    andamento: "Concluindo",
    feitas: "concluídas",
    falhou: "concluída",
  },
  extornar: {
    verbo: "Extornar",
    andamento: "Extornando",
    feitas: "extornadas",
    falhou: "extornada",
  },
  excluir: {
    verbo: "Excluir",
    andamento: "Excluindo",
    feitas: "excluídas",
    falhou: "excluída",
  },
  data: {
    verbo: "Alterar data de",
    andamento: "Alterando a data das",
    feitas: "alteradas",
    falhou: "alterada",
  },
  valor: {
    verbo: "Alterar valor de",
    andamento: "Alterando o valor das",
    feitas: "alteradas",
    falhou: "alterada",
  },
  categorias: {
    verbo: "Alterar categorias de",
    andamento: "Alterando as categorias das",
    feitas: "alteradas",
    falhou: "alterada",
  },
};

// componente à parte: só busca as categorias da conta quando a ação é esta
const EscolhaCategorias: React.FC<{
  idConta: number;
  escolhidas: number[];
  setEscolhidas: (ids: number[]) => void;
}> = ({ idConta, escolhidas, setEscolhidas }) => {
  const { categorias } = useCategorias(idConta);
  return (
    <CheckBoxList<Categoria>
      itens={categorias}
      chaveId="idCategoria"
      chaveTexto="nome"
      selecionados={escolhidas}
      setSelecionados={setEscolhidas}
      rotulo="Categorias"
    />
  );
};

type Falha = { mov: Movimentacao; motivo: string };

type PropAcaoEmMassa = {
  acao: TipoAcaoEmMassa;
  movimentacoes: Movimentacao[]; // só as que a ação muda (ex.: concluir recebe só as pendentes)
  ignoradas: number; // selecionadas que já estão no estado pedido: avisa que ficam como estão
  // alterou ao menos uma: a tela busca de novo; falhas = as que continuam selecionadas
  onClose: (alterou: boolean, falhas: Movimentacao[]) => void;
};

// Ação nas selecionadas: confirma, executa uma por vez mostrando o progresso e, no fim,
// quantas deram certo e o motivo de cada uma que não deu.
const AcaoEmMassa: React.FC<PropAcaoEmMassa> = ({
  acao,
  movimentacoes,
  ignoradas,
  onClose,
}) => {
  const textos = TEXTOS[acao];
  const [iniciado, setIniciado] = useState(false);
  // concluir: agora (como o popup da linha) ou a data de cada movimentação
  const [usarDataMov, setUsarDataMov] = useState(false);
  // alterar data: a mesma data para todas
  // começa no dia do início do filtro, às 08:00 (pedido do usuário); o botão "Agora" troca pela hora atual
  const { filtros } = useFiltrosUrl();
  const [novaData, setNovaData] = useState(
    () => `${filtros.inicio.slice(0, 10)}T08:00`,
  );
  // ou só o dia: cada uma mantém mês, ano e hora (pedido do usuário)
  const [modoData, setModoData] = useState<ModoData>("inteira");
  const [novoDia, setNovoDia] = useState(1);
  const trocarData = (mov: Movimentacao) => {
    if (modoData === "inteira")
      return alterarDataMovimentacao(mov, paraIsoUtc(novaData));
    const atual = dataHoraLocal(mov.dthrMovimentacao);
    const nova = comDia(atual, novoDia);
    // já está nesse dia: conta como feita, sem requisição
    if (nova === atual) return Promise.resolve(undefined);
    return alterarDataMovimentacao(mov, paraIsoUtc(nova));
  };
  // alterar categorias: o que fazer com as atuais e quais categorias
  const [modo, setModo] = useState<ModoCategorias>("adicionar");
  const [escolhidas, setEscolhidas] = useState<number[]>([]);
  // substituir sem nenhuma escolhida é válido (todas ficam sem categoria); adicionar/remover nada, não
  const faltaCategoria =
    acao === "categorias" && modo !== "substituir" && escolhidas.length === 0;
  // alterar valor: o mesmo valor para todas, substitui o atual (zerado não envia)
  const [novoValor, setNovoValor] = useState(0);
  const faltaValor = acao === "valor" && !(novoValor > 0);
  const [feitas, setFeitas] = useState(0);
  const [falhas, setFalhas] = useState<Falha[]>([]);
  const total = movimentacoes.length;
  const terminou = iniciado && feitas === total;
  const certas = feitas - falhas.length;

  const trocarCategorias = async (mov: Movimentacao) => {
    const atuais = mov.categorias.map((c) => c.idCategoria);
    const novas = categoriasResultantes(atuais, escolhidas, modo);
    // já está como pedido: conta como feita, sem requisição
    if (mesmasCategorias(atuais, novas)) return undefined;
    return alterarCategorias(mov, novas);
  };

  const executar = (mov: Movimentacao, agora: string) =>
    acao === "categorias"
      ? trocarCategorias(mov)
      : acao === "valor"
      ? mov.valor === novoValor
        ? Promise.resolve(undefined) // já tem esse valor: conta como feita, sem requisição
        : alterarValorMovimentacao(mov, novoValor)
      : acao === "excluir"
      ? removerMovimentacao(mov)
      : acao === "extornar"
        ? extornarMovimentacao(mov)
        : acao === "data"
          ? trocarData(mov)
          : concluirMovimentacao(
              mov,
              usarDataMov
                ? new Date(mov.dthrMovimentacao).toISOString()
                : agora,
            );

  // uma por vez: o progresso anda a cada resposta
  const iniciar = async () => {
    setIniciado(true);
    const agora = new Date().toISOString();
    for (const mov of movimentacoes) {
      const erro = await executar(mov, agora);
      if (erro) setFalhas((atual) => [...atual, { mov, motivo: erro }]);
      setFeitas((n) => n + 1);
    }
  };

  const fechar = () =>
    onClose(
      certas > 0,
      falhas.map((f) => f.mov),
    );
  const quantas = total === 1 ? "1 movimentação" : `${total} movimentações`;
  // toda ação em massa pede um "Sim" antes de começar (pedido do usuário)
  const [confirmando, setConfirmando] = useState(false);
  const detalhe =
    acao === "valor"
      ? ` Todas ficam com ${formatarMoeda(novoValor)}.`
      : acao === "data"
        ? modoData === "dia"
          ? ` Todas vão para o dia ${novoDia}, cada uma no seu mês (ou o último dia do mês, se ele não tiver o dia ${novoDia}).`
          : ` Todas ficam com a data ${formatarDataHora(novaData)}.`
        : acao === "excluir"
          ? " Isso não pode ser desfeito."
          : "";

  return (
    <Dialog
      open
      // durante a execução não fecha (Esc nem clique fora); antes de começar, fechar = cancelar
      onClose={
        !iniciado ? () => onClose(false, []) : terminou ? fechar : undefined
      }
      fullWidth
      maxWidth="sm"
      aria-labelledby="titulo-acao-em-massa"
    >
      <DialogTitle id="titulo-acao-em-massa" sx={{ fontWeight: 700 }}>
        {!iniciado
          ? `${textos.verbo} ${quantas}?`
          : terminou
            ? "Pronto"
            : `${textos.andamento} movimentações…`}
      </DialogTitle>

      <DialogContent>
        {!iniciado ? (
          <>
            {ignoradas > 0 && (
              <DialogContentText sx={{ mb: 1 }}>
                {ignoradas === 1
                  ? `1 selecionada já está ${textos.falhou} e fica como está.`
                  : `${ignoradas} selecionadas já estão ${textos.feitas} e ficam como estão.`}
              </DialogContentText>
            )}
            {acao === "excluir" && (
              <DialogContentText>Isso não pode ser desfeito.</DialogContentText>
            )}
            {acao === "concluir" && (
              <InputCheckBox
                rotulo="Usar a data de cada movimentação (senão, agora)"
                marcado={usarDataMov}
                setMarcado={setUsarDataMov}
              />
            )}
            {acao === "data" && (
              // respiro: o rótulo do campo fica acima da borda e o DialogContent corta
              <Stack spacing={2} sx={{ pt: 1 }}>
                <InputSelect
                  rotulo="O que mudar"
                  opcoes={OPCOES_MODO_DATA}
                  valor={modoData}
                  setValor={(valor) => setModoData(valor as ModoData)}
                />
                {modoData === "dia" ? (
                  <InputSelect
                    rotulo="Novo dia"
                    opcoes={OPCOES_DIA}
                    valor={String(novoDia)}
                    setValor={(valor) => setNovoDia(Number(valor))}
                  />
                ) : (
                  <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
                    <Box sx={{ flex: 1 }}>
                      <CampoDataHora
                        rotulo="Nova data da movimentação"
                        valor={novaData}
                        setValor={setNovaData}
                      />
                    </Box>
                    <Button
                      color="inherit"
                      startIcon={<Icon>schedule</Icon>}
                      onClick={() => setNovaData(dataHoraLocal())}
                    >
                      Agora
                    </Button>
                  </Stack>
                )}
              </Stack>
            )}
            {acao === "valor" && (
              <Stack spacing={2} sx={{ pt: 1 }}>
                <InputPrice
                  rotulo="Novo valor (R$)"
                  valor={novoValor}
                  setValor={setNovoValor}
                />
                <Alert severity="info">
                  Todas as selecionadas ficam com este valor. Receitas continuam
                  receitas e despesas continuam despesas.
                </Alert>
              </Stack>
            )}
            {acao === "categorias" && (
              <Stack spacing={2} sx={{ pt: 1 }}>
                <InputSelect
                  rotulo="O que fazer"
                  opcoes={OPCOES_MODO_CATEGORIAS}
                  valor={modo}
                  setValor={(valor) => setModo(valor as ModoCategorias)}
                />
                <EscolhaCategorias
                  idConta={movimentacoes[0].idConta}
                  escolhidas={escolhidas}
                  setEscolhidas={setEscolhidas}
                />
                {modo === "substituir" && escolhidas.length === 0 && (
                  <Alert severity="warning">
                    Sem nenhuma categoria escolhida, todas ficam sem categoria.
                  </Alert>
                )}
              </Stack>
            )}
          </>
        ) : (
          <>
            <Typography sx={{ mb: 1 }} aria-live="polite">
              {terminou
                ? `${certas} de ${total} ${textos.feitas}.`
                : `${feitas} de ${total}…`}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(feitas / total) * 100}
              aria-label="Progresso"
            />
            {falhas.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {falhas.length === 1
                  ? `1 não pôde ser ${textos.falhou}:`
                  : `${falhas.length} não puderam ser ${textos.feitas}:`}
                <List dense disablePadding>
                  {falhas.map(({ mov, motivo }) => (
                    <ListItem
                      key={`${mov.id} ${mov.idFixo} ${mov.dthrMovimentacao}`}
                      disableGutters
                    >
                      <ListItemText
                        primary={`${mov.titulo} · ${formatarData(mov.dthrMovimentacao)}`}
                        secondary={motivo}
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!iniciado ? (
          <>
            <Button color="inherit" onClick={() => onClose(false, [])}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color={acao === "excluir" ? "error" : "primary"}
              onClick={() => setConfirmando(true)}
              disabled={faltaCategoria || faltaValor}
            >
              {textos.verbo}
            </Button>
          </>
        ) : (
          <Button variant="contained" disabled={!terminou} onClick={fechar}>
            Fechar
          </Button>
        )}
      </DialogActions>

      {confirmando && (
        <MsgBox
          tipo="pergunta"
          titulo="Tem certeza?"
          descricao={`${textos.verbo} ${quantas}.${detalhe}`}
          aoResponder={(sim) => {
            setConfirmando(false);
            if (sim) iniciar();
          }}
        />
      )}
    </Dialog>
  );
};

export default AcaoEmMassa;
