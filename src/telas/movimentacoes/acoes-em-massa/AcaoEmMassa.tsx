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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";

import type { Movimentacao } from "../../../models/movimentacoes/GetMovimentacoes";
import {
  alterarDataMovimentacao,
  concluirMovimentacao,
  extornarMovimentacao,
  removerMovimentacao,
} from "../../../services/movimentacoes/movimentacaoService";
import InputCheckBox from "../../../props/input-check-box/InputCheckBox";
import CampoDataHora from "../../../props/campo-data-hora/CampoDataHora";
import {
  dataHoraLocal,
  formatarData,
  paraIsoUtc,
} from "../../../utils/formatacao";

export type TipoAcaoEmMassa = "concluir" | "extornar" | "excluir" | "data";

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
  const [novaData, setNovaData] = useState(() => dataHoraLocal());
  const [feitas, setFeitas] = useState(0);
  const [falhas, setFalhas] = useState<Falha[]>([]);
  const total = movimentacoes.length;
  const terminou = iniciado && feitas === total;
  const certas = feitas - falhas.length;

  const executar = (mov: Movimentacao, agora: string) =>
    acao === "excluir"
      ? removerMovimentacao(mov)
      : acao === "extornar"
        ? extornarMovimentacao(mov)
        : acao === "data"
          ? alterarDataMovimentacao(mov, paraIsoUtc(novaData))
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
              <Box sx={{ pt: 1 }}>
                <CampoDataHora
                  rotulo="Nova data da movimentação"
                  valor={novaData}
                  setValor={setNovaData}
                />
              </Box>
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
              onClick={iniciar}
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
    </Dialog>
  );
};

export default AcaoEmMassa;
