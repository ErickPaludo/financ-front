import { useContext, useState } from "react";
import { Alert, Box, Button, Divider, Stack } from "@mui/material";

import Conecta from "../../services/api/apiConnect";
import {
  alterarCategoriasMovimentacao,
  mesmasCategorias,
} from "../../services/movimentacoes/movimentacaoService";
import {
  TIPO_MOVIMENTACAO,
  type Categoria,
} from "../../models/movimentacoes/GetMovimentacoes";
import { ContaContext } from "../../contexts/ContaContext";
import { useCategorias } from "../../hooks/useCategorias";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import Modal from "../modal/Modal";
import TituloSecao from "../titulo-secao/TituloSecao";
import CampoTexto from "../../props/campo-texto/CampoTexto";
import CampoDataHora from "../../props/campo-data-hora/CampoDataHora";
import CheckBoxList from "../../props/check-box-list/CheckBoxList";
import InputPrice from "../../props/input-price/InputPrice";
import InputSelect from "../../props/input-select/InputSelect";
import SeletorTipoMovimentacao from "../../props/seletor-tipo-movimentacao/SeletorTipoMovimentacao";
import { paraIsoUtc, periodoDoMes } from "../../utils/formatacao";
import {
  ANO_OCORRENCIA,
  DIAS_POR_MES,
  DIAS_SEMANA,
  MESES,
  OCORRENCIA,
  dataParaCampo,
  paraHorarioBrasilia,
  type Agendada,
} from "./agendadas";

const STATUS_ATIVA = 0;
const STATUS_EXCLUIDA = 1;

type PropFormularioAgendada = {
  aberto: boolean;
  agendada: Agendada | null; // com agendada: edita; sem: cadastra
  onClose: () => void;
  onSalvo: () => void; // depois de salvar ou excluir (para rebuscar a lista)
};

// Gaveta da direita para cadastrar ou editar uma movimentação agendada.
const FormularioAgendada: React.FC<PropFormularioAgendada> = ({
  aberto,
  agendada,
  onClose,
  onSalvo,
}) => (
  <Modal
    aberto={aberto}
    titulo={agendada ? "Editar agendada" : "Nova agendada"}
    onClose={onClose}
  >
    {/* a gaveta remonta o formulário a cada abertura: o estado começa com os dados da agendada */}
    <Formulario
      key={agendada?.id ?? "nova"}
      agendada={agendada}
      onSalvo={() => {
        onClose();
        onSalvo();
      }}
    />
  </Modal>
);

// título de cada parte do formulário
const Secao: React.FC<{ titulo: string }> = ({ titulo }) => (
  <Box>
    <TituloSecao semRecuo>{titulo}</TituloSecao>
    <Divider />
  </Box>
);

const Formulario: React.FC<{
  agendada: Agendada | null;
  onSalvo: () => void;
}> = ({ agendada, onSalvo }) => {
  const { conta } = useContext(ContaContext);
  const idConta = conta!.idConta;
  const { categorias } = useCategorias(idConta);
  const base = agendada?.movimentacaoBase;
  const ocorre = agendada && paraHorarioBrasilia(agendada.dataOcorrencia);

  const [dataInicial, setDataInicial] = useState(() =>
    agendada ? dataParaCampo(agendada.dataInicio) : periodoDoMes().inicio,
  );
  const [dataFinal, setDataFinal] = useState(() =>
    agendada ? dataParaCampo(agendada.dataFim) : periodoDoMes().fim,
  );
  const [ocorrencia, setOcorrencia] = useState(
    agendada ? String(agendada.tipo) : OCORRENCIA.Mensal,
  );
  const [mes, setMes] = useState(ocorre ? String(ocorre.getMonth() + 1) : "1");
  const [dia, setDia] = useState(ocorre ? String(ocorre.getDate()) : "1");
  const [diasSemana, setDiasSemana] = useState<number[]>(
    agendada?.tipo === 0 ? agendada.ocorrenciaDiaria || [] : [1],
  );
  const [tipo, setTipo] = useState<number>(
    base?.tipo ?? TIPO_MOVIMENTACAO.Receita,
  );
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<
    number[]
  >(() => base?.categorias.map((c) => c.idCategoria) ?? []);
  const [titulo, setTitulo] = useState(base?.titulo ?? "");
  const [observacao, setObservacao] = useState(base?.observacao ?? "");
  const [valor, setValor] = useState(base?.valor ?? 0);

  const diasDoMes = Array.from(
    { length: DIAS_POR_MES[Number(mes) - 1] },
    (_, i) => ({ rotulo: String(i + 1), valor: String(i + 1) }),
  );
  const semanal = ocorrencia === OCORRENCIA.Semanal;
  const rotaFixas = `/Contas/${idConta}/Movimentacoes/Fixa`;

  // trocar o mês ajusta o dia quando ele não existe no mês novo (ex.: 31 -> fevereiro)
  const alterarMes = (novoMes: string) => {
    setMes(novoMes);
    const ultimoDia = DIAS_POR_MES[Number(novoMes) - 1];
    if (Number(dia) > ultimoDia) setDia(String(ultimoDia));
  };

  // Devolve o erro, ou nada quando deu certo (useEnvioFormulario).
  const salvar = async () => {
    const datas = {
      dataInicio: paraIsoUtc(dataInicial),
      dataFim: paraIsoUtc(dataFinal),
    };
    // semanal: dias da semana; mensal/anual: tipo + dia (e mês) da ocorrência
    const recorrencia = semanal
      ? { ...datas, ocorrenciaDiaria: diasSemana }
      : {
          ...datas,
          tipo: parseInt(ocorrencia),
          dataOcorrencia: new Date(
            ANO_OCORRENCIA,
            Number(mes) - 1,
            Number(dia),
            12,
          ).toISOString(),
        };
    const movimentacao = { tipo, valor, titulo, observacao };

    if (!agendada) {
      const resposta = await Conecta<string>(
        semanal ? `${rotaFixas}/Diarias` : rotaFixas,
        "POST",
        {
          ...recorrencia,
          movimentacao: { ...movimentacao, idsCategoria: categoriasSelecionadas },
        },
      );
      if (!resposta.sucesso)
        return resposta.erro ?? "Erro ao cadastrar movimentação.";
    } else {
      const respostaRecorrencia = await Conecta<string>(
        `${rotaFixas}/${agendada.id}/Alterar${semanal ? "/Diario" : ""}`,
        "PATCH",
        semanal ? recorrencia : { ...recorrencia, status: STATUS_ATIVA },
      );
      if (!respostaRecorrencia.sucesso)
        return respostaRecorrencia.erro ?? "Erro ao editar movimentação.";

      const idMov = agendada.movimentacaoBase.id;
      const respostaBase = await Conecta<string>(
        `Contas/Movimentacoes/${idMov}/Alterar`,
        "PATCH",
        movimentacao,
      );
      if (!respostaBase.sucesso)
        return respostaBase.erro ?? "Erro ao editar movimentação.";

      const categoriasOriginais = agendada.movimentacaoBase.categorias.map(
        (c) => c.idCategoria,
      );
      if (!mesmasCategorias(categoriasOriginais, categoriasSelecionadas)) {
        const respostaCategorias = await alterarCategoriasMovimentacao(
          idMov,
          categoriasSelecionadas,
        );
        if (!respostaCategorias.sucesso)
          return respostaCategorias.erro ?? "Erro ao atualizar categorias.";
      }
    }
    onSalvo();
  };

  const excluir = async () => {
    const resposta = await Conecta<string>(
      `${rotaFixas}/${agendada!.id}/Alterar${semanal ? "/Diario" : ""}`,
      "PATCH",
      { status: STATUS_EXCLUIDA },
    );
    if (!resposta.sucesso) return resposta.erro ?? "Erro ao excluir.";
    onSalvo();
  };

  const envio = useEnvioFormulario(salvar);
  const exclusao = useEnvioFormulario(excluir);
  const ocupado = envio.enviando || exclusao.enviando;
  const erro = envio.erro ?? exclusao.erro;

  return (
    <Stack
      component="form"
      onSubmit={envio.enviar}
      noValidate
      spacing={2}
      sx={{ flex: 1 }}
    >
      <Secao titulo="Recorrência" />
      {/* só mensal por enquanto: semanal e anual estavam comentadas (o resto do formulário já trata as três) */}
      <InputSelect
        rotulo="Tipo de ocorrência"
        opcoes={[{ rotulo: "Mensal", valor: OCORRENCIA.Mensal }]}
        valor={ocorrencia}
        setValor={setOcorrencia}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <CampoDataHora
          rotulo="Data inicial"
          valor={dataInicial}
          setValor={setDataInicial}
        />
        <CampoDataHora
          rotulo="Data final"
          valor={dataFinal}
          setValor={setDataFinal}
        />
      </Stack>

      {ocorrencia === OCORRENCIA.Semanal && (
        <CheckBoxList
          itens={DIAS_SEMANA}
          chaveId="id"
          chaveTexto="nome"
          selecionados={diasSemana}
          setSelecionados={setDiasSemana}
          rotulo="Dias da semana"
        />
      )}
      {ocorrencia === OCORRENCIA.Mensal && (
        <InputSelect
          rotulo="Dia em que ocorrerá a movimentação"
          opcoes={diasDoMes}
          valor={dia}
          setValor={setDia}
        />
      )}
      {ocorrencia === OCORRENCIA.Anual && (
        <Stack direction="row" spacing={1.5}>
          <InputSelect
            rotulo="Mês"
            opcoes={MESES}
            valor={mes}
            setValor={alterarMes}
          />
          <InputSelect
            rotulo="Dia"
            opcoes={diasDoMes}
            valor={dia}
            setValor={setDia}
          />
        </Stack>
      )}

      <Secao titulo="Movimentação" />
      <SeletorTipoMovimentacao valor={tipo} setValor={setTipo} />
      <CampoTexto
        label="Título"
        valor={titulo}
        setValor={setTitulo}
        placeholder="Ex: Salário"
      />
      <InputPrice rotulo="Valor" valor={valor} setValor={setValor} />
      <CampoTexto label="Observação" valor={observacao} setValor={setObservacao} />
      <CheckBoxList<Categoria>
        itens={categorias}
        chaveId="idCategoria"
        chaveTexto="nome"
        selecionados={categoriasSelecionadas}
        setSelecionados={setCategoriasSelecionadas}
        rotulo="Categorias"
      />

      {erro && <Alert severity="error">{erro}</Alert>}

      <Box sx={{ flex: 1 }} />

      {agendada ? (
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            color="error"
            disabled={ocupado}
            onClick={exclusao.enviar}
            sx={{ flex: 1 }}
          >
            {exclusao.enviando ? "Excluindo..." : "Excluir"}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={ocupado}
            sx={{ flex: 1 }}
          >
            {envio.enviando ? "Salvando..." : "Salvar"}
          </Button>
        </Stack>
      ) : (
        <Button type="submit" variant="contained" fullWidth disabled={ocupado}>
          {envio.enviando ? "Cadastrando..." : "Cadastrar"}
        </Button>
      )}
    </Stack>
  );
};

export default FormularioAgendada;
