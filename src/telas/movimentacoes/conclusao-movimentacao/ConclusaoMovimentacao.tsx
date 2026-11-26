import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import Conecta from "../../../services/api/apiConnect";
import {
  cadastrarMovimentacao,
  materializarMovimentacao,
} from "../../../services/movimentacoes/movimentacaoService";
import type { Movimentacao } from "../../../models/movimentacoes/GetMovimentacoes";
import { useEnvioFormulario } from "../../../hooks/useEnvioFormulario";
import CampoDataHora from "../../../props/campo-data-hora/CampoDataHora";
import InputCheckBox from "../../../props/input-check-box/InputCheckBox";
import Modal from "../../../componentes/modal/Modal";
import CadMov from "../cad-mov/CadMov";
import {
  dataHoraLocal,
  formatarMoeda,
  paraIsoUtc,
} from "../../../utils/formatacao";

interface PropConclusaoMovimentacao {
  onClose: () => void;
  buscaMovimentacoes: () => void;
  movimentacaoSelecionada: Movimentacao;
}

// Popup da linha da tabela: concluir/extornar, deletar, alterar (abre o CadMov na gaveta) ou copiar.
const ConclusaoMovimentacao: React.FC<PropConclusaoMovimentacao> = ({
  onClose,
  buscaMovimentacoes,
  movimentacaoSelecionada,
}) => {
  const [usarDataMovimentacao, setUsarDataMovimentacao] = useState(false);
  const [dataConclusao, setDataConclusao] = useState(() => dataHoraLocal());
  // depois de materializar, a movimentação virtual vira a real (id novo)
  const [movAtual, setMovAtual] = useState(movimentacaoSelecionada);
  const [alterando, setAlterando] = useState(false);
  const [copiando, setCopiando] = useState(false);
  const [dataCopia, setDataCopia] = useState(() =>
    dataHoraLocal(movimentacaoSelecionada.dthrMovimentacao),
  );

  const alternarUsarDataMovimentacao = (usar: boolean) => {
    setUsarDataMovimentacao(usar);
    setDataConclusao(
      dataHoraLocal(
        usar ? movimentacaoSelecionada.dthrMovimentacao : undefined,
      ),
    );
  };

  // Concluir e deletar materializam a movimentação virtual antes; alterar não (o CadMov cuida disso).
  // Devolve o erro, ou nada quando deu certo.
  const executar = async (
    rota: (idMov: number) => string,
    metodo: "POST" | "DELETE",
    corpo?: object,
  ) => {
    let idMov = movAtual.id;
    if (idMov === 0) {
      const resposta = await materializarMovimentacao(movimentacaoSelecionada);
      if (!resposta.sucesso || !resposta.dados)
        return resposta.erro ?? "Erro ao materializar movimentação.";
      setMovAtual(resposta.dados.valor);
      idMov = resposta.dados.valor.id;
    }

    const resposta = await Conecta<string>(rota(idMov), metodo, corpo);
    if (!resposta.sucesso)
      return resposta.erro ?? "Não foi possível alterar a movimentação.";
    buscaMovimentacoes();
    onClose();
  };

  const conclusao = useEnvioFormulario(() =>
    executar(
      (id) =>
        `/Contas/Movimentacoes/${id}/${movAtual.concluido ? "Extornar" : "Concluir"}`,
      "POST",
      movAtual.concluido
        ? undefined
        : { dthrConclusao: paraIsoUtc(dataConclusao) },
    ),
  );
  const exclusao = useEnvioFormulario(() =>
    executar((id) => `/Contas/Movimentacoes/${id}/Remover`, "DELETE"),
  );
  // cópia nova e pendente; a original (mesmo virtual) fica como está
  const copia = useEnvioFormulario(async () => {
    const m = movimentacaoSelecionada;
    const resposta = await cadastrarMovimentacao(m.idConta, {
      tipo: m.tipo,
      valor: m.valor,
      concluido: false,
      titulo: m.titulo,
      observacao: m.observacao ?? "",
      dthrMovimentacao: paraIsoUtc(dataCopia),
      dthrConclusao: null,
      idsCategoria: m.categorias.map((c) => c.idCategoria),
    });
    if (!resposta.sucesso)
      return resposta.erro ?? "Não foi possível copiar a movimentação.";
    buscaMovimentacoes();
    onClose();
  });
  const ocupado = conclusao.enviando || exclusao.enviando || copia.enviando;
  const erro = conclusao.erro ?? exclusao.erro ?? copia.erro;

  return (
    <>
      <Dialog
        // "Alterar" troca o popup pela gaveta (o componente segue montado por causa dela)
        open={!alterando}
        onClose={ocupado ? undefined : onClose}
        fullWidth
        maxWidth="xs"
        aria-labelledby="titulo-conclusao-mov"
      >
        <DialogTitle id="titulo-conclusao-mov" sx={{ pr: 6 }}>
          {movimentacaoSelecionada.titulo}
          <Typography sx={{ fontSize: 22, fontWeight: 700 }}>
            {formatarMoeda(movimentacaoSelecionada.valor)}
          </Typography>
        </DialogTitle>
        <IconButton
          onClick={onClose}
          aria-label="Fechar"
          disabled={ocupado}
          sx={{ position: "absolute", top: 8, right: 8 }}
        >
          <Icon>close</Icon>
        </IconButton>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {erro && <Alert severity="error">{erro}</Alert>}
            {copiando ? (
              <CampoDataHora
                rotulo="Data da cópia"
                valor={dataCopia}
                setValor={setDataCopia}
              />
            ) : (
              !movAtual.concluido && (
                <>
                  <InputCheckBox
                    rotulo="Usar data da movimentação"
                    marcado={usarDataMovimentacao}
                    setMarcado={alternarUsarDataMovimentacao}
                  />
                  <CampoDataHora
                    rotulo="Data conclusão"
                    valor={dataConclusao}
                    setValor={setDataConclusao}
                  />
                </>
              )
            )}
            {!copiando && movimentacaoSelecionada.id === 0 && (
              <Alert severity="info">
                Esta movimentação foi criada a partir de um agendamento.
                Alterações futuras no agendamento não afetarão esta
                movimentação.
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          {copiando ? (
            <>
              <Button
                onClick={() => setCopiando(false)}
                disabled={ocupado}
                sx={{ mr: "auto" }}
              >
                Voltar
              </Button>
              <Button
                variant="contained"
                onClick={copia.enviar}
                disabled={ocupado}
              >
                Criar cópia
              </Button>
            </>
          ) : (
            <>
              {/* com fundo: só o contorno ficava apagado sobre o diálogo */}
              <Button
                variant="contained"
                color="error"
                disableElevation
                onClick={exclusao.enviar}
                disabled={ocupado}
                sx={{ mr: "auto" }}
              >
                Deletar
              </Button>
              <Button
                variant="contained"
                color="warning" // laranja do tema
                disableElevation
                onClick={() => setAlterando(true)}
                disabled={ocupado}
              >
                Alterar
              </Button>
              <Button
                variant="contained"
                color="secondary"
                disableElevation
                onClick={() => setCopiando(true)}
                disabled={ocupado}
              >
                Copiar
              </Button>
              <Button
                variant="contained"
                onClick={conclusao.enviar}
                disabled={ocupado}
              >
                {movAtual.concluido ? "Extornar" : "Concluir"}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* o formulário de edição continua na gaveta, como os demais;
          fechar a gaveta sem salvar encerra tudo (não volta ao popup) */}
      <Modal aberto={alterando} titulo="Editar transação" onClose={onClose}>
        <CadMov
          // a original (id 0 se for virtual): o CadMov materializa antes do PATCH
          movimentacao={movimentacaoSelecionada}
          onClose={() => {
            buscaMovimentacoes();
            onClose();
          }}
        />
      </Modal>
    </>
  );
};

export default ConclusaoMovimentacao;
