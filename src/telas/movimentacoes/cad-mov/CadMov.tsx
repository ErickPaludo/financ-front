import { useContext, useState } from "react";
import { Alert, Button, Stack } from "@mui/material";

import Conecta from "../../../services/api/apiConnect";
import {
  alterarCategoriasMovimentacao,
  materializarMovimentacao,
  mesmasCategorias,
} from "../../../services/movimentacoes/movimentacaoService";
import {
  TIPO_MOVIMENTACAO,
  type Categoria,
  type Movimentacao,
} from "../../../models/movimentacoes/GetMovimentacoes";
import type { MovimentacaoPost } from "../../../models/movimentacoes/MovimentacaoPost";
import type { MovimentacaoPatch } from "../../../models/movimentacoes/MovimentacaoPatch";
import { ContaContext } from "../../../contexts/ContaContext";
import { useCategorias } from "../../../hooks/useCategorias";
import { useEnvioFormulario } from "../../../hooks/useEnvioFormulario";
import CampoTexto from "../../../props/campo-texto/CampoTexto";
import CampoDataHora from "../../../props/campo-data-hora/CampoDataHora";
import InputPrice from "../../../props/input-price/InputPrice";
import InputCheckBox from "../../../props/input-check-box/InputCheckBox";
import CheckBoxList from "../../../props/check-box-list/CheckBoxList";
import SeletorTipoMovimentacao from "../../../props/seletor-tipo-movimentacao/SeletorTipoMovimentacao";
import { dataHoraLocal, paraIsoUtc } from "../../../utils/formatacao";

interface PropCadMov {
  // no cadastro, recebe a movimentação criada (se a API devolveu) para a tela incluir sem buscar de novo
  onClose: (cadastrada?: Movimentacao) => void;
  // com movimentação: edita; sem: cadastra
  movimentacao?: Movimentacao;
}

// Formulário de transação na gaveta. A gaveta o monta de novo a cada abertura,
// então o estado já começa com os dados da movimentação editada.
const CadMov: React.FC<PropCadMov> = ({ onClose, movimentacao: mov }) => {
  const { conta } = useContext(ContaContext);
  const { categorias } = useCategorias(conta!.idConta);
  const edicao = Boolean(mov);

  const [tipo, setTipo] = useState<number>(
    mov?.tipo ?? TIPO_MOVIMENTACAO.Receita,
  );
  const [titulo, setTitulo] = useState(mov?.titulo ?? "");
  const [descricao, setDescricao] = useState(mov?.observacao ?? "");
  const [valor, setValor] = useState(mov?.valor ?? 0);
  const [dataMovimentacao, setDataMovimentacao] = useState(() =>
    dataHoraLocal(mov?.dthrMovimentacao),
  );
  // sem data de conclusão, a conclusão parte da data da movimentação
  const [dataConclusao, setDataConclusao] = useState(() =>
    dataHoraLocal(mov?.dthrConclusao ?? mov?.dthrMovimentacao),
  );
  const [concluido, setConcluido] = useState(mov?.concluido ?? false);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<
    number[]
  >(() => mov?.categorias.map((cat) => cat.idCategoria) ?? []);

  const alterarDataMovimentacao = (data: string) => {
    setDataMovimentacao(data);
    setDataConclusao(data);
  };

  const cadastrar = async () => {
    const corpo: MovimentacaoPost = {
      tipo,
      valor,
      concluido,
      titulo,
      observacao: descricao,
      dthrMovimentacao: paraIsoUtc(dataMovimentacao),
      dthrConclusao: concluido ? paraIsoUtc(dataConclusao) : null,
      idsCategoria: categoriasSelecionadas,
    };
    // a API devolve { valor: Movimentacao }, como nos outros cadastros
    const resposta = await Conecta<{ valor?: Movimentacao }>(
      `/Contas/${conta!.idConta}/Movimentacoes`,
      "POST",
      corpo,
    );
    if (!resposta.sucesso)
      return resposta.erro ?? "Erro ao cadastrar movimentação.";

    const criada = resposta.dados?.valor;
    // sem id real não dá para incluir (clicar na linha quebraria): quem chama busca na API
    if (!criada?.id) return onClose();
    onClose({
      ...criada,
      // se a resposta não trouxer as categorias, usa as escolhidas no formulário
      categorias: criada.categorias?.length
        ? criada.categorias
        : categorias.filter((c) =>
            categoriasSelecionadas.includes(c.idCategoria),
          ),
    });
  };

  const editar = async (mov: Movimentacao) => {
    // movimentação virtual (gerada por agendamento) precisa existir antes do PATCH
    let idMov = mov.id;
    if (idMov === 0) {
      const materializada = await materializarMovimentacao(mov);
      if (!materializada.sucesso || !materializada.dados)
        return materializada.erro ?? "Erro ao materializar movimentação.";
      idMov = materializada.dados.valor.id;
    }

    // só vai o que mudou
    const dataMovUtc = paraIsoUtc(dataMovimentacao);
    const dataConclusaoUtc = paraIsoUtc(dataConclusao);
    const corpo: MovimentacaoPatch = {
      tipo: concluido ? null : tipo,
      valor: mov.valor !== valor ? valor : null,
      titulo: mov.titulo !== titulo ? titulo : null,
      observacao: mov.observacao !== descricao ? descricao : null,
      dthrMovimentacao:
        dataMovUtc !== mov.dthrMovimentacao ? dataMovUtc : null,
      dthrConclusao:
        mov.concluido && dataConclusaoUtc !== mov.dthrConclusao
          ? dataConclusaoUtc
          : null,
    };
    const resposta = await Conecta<string>(
      `Contas/Movimentacoes/${idMov}/Alterar`,
      "PATCH",
      corpo,
    );
    if (!resposta.sucesso)
      return resposta.erro ?? "Erro ao editar movimentação.";

    const categoriasOriginais = mov.categorias.map((cat) => cat.idCategoria);
    if (!mesmasCategorias(categoriasOriginais, categoriasSelecionadas)) {
      const respostaCategorias = await alterarCategoriasMovimentacao(
        idMov,
        categoriasSelecionadas,
      );
      if (!respostaCategorias.sucesso)
        return respostaCategorias.erro ?? "Erro ao alterar categorias.";
    }
    onClose();
  };

  const envio = useEnvioFormulario(() => (mov ? editar(mov) : cadastrar()));

  return (
    <Stack component="form" onSubmit={envio.enviar} noValidate spacing={1.5}>
      <SeletorTipoMovimentacao
        valor={tipo}
        setValor={setTipo}
        bloqueado={mov?.concluido}
      />

      <CampoTexto
        label="Título"
        valor={titulo}
        placeholder="Ex: Mercado"
        setValor={setTitulo}
      />

      <CampoTexto
        label="Descrição"
        valor={descricao}
        placeholder="Ex: Compra do mês"
        setValor={setDescricao}
        slotProps={{ htmlInput: { maxLength: 255 } }}
      />

      <InputPrice rotulo="Valor (R$)" valor={valor} setValor={setValor} />

      <CheckBoxList<Categoria>
        itens={categorias}
        chaveId="idCategoria"
        chaveTexto="nome"
        selecionados={categoriasSelecionadas}
        setSelecionados={setCategoriasSelecionadas}
        rotulo="Categorias"
      />

      <CampoDataHora
        rotulo="Data movimentação"
        valor={dataMovimentacao}
        setValor={alterarDataMovimentacao}
      />

      {!edicao && (
        <InputCheckBox
          rotulo="Movimentação concluída"
          marcado={concluido}
          setMarcado={setConcluido}
        />
      )}

      {concluido && (
        <CampoDataHora
          rotulo="Data conclusão"
          valor={dataConclusao}
          setValor={setDataConclusao}
        />
      )}

      {envio.erro && <Alert severity="error">{envio.erro}</Alert>}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={envio.enviando}
      >
        {edicao
          ? envio.enviando
            ? "Editando..."
            : "Editar"
          : envio.enviando
            ? "Cadastrando..."
            : "Cadastrar"}
      </Button>
    </Stack>
  );
};

export default CadMov;
