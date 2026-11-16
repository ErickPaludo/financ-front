import { useCallback, useContext, useEffect, useState } from "react";
import { Alert, Button } from "@mui/material";

import Conecta from "../../../services/api/apiConnect";
import {
  alterarCategoriasMovimentacao,
  mesmasCategorias,
} from "../../../services/movimentacoes/movimentacaoService";
import {
  TIPO_MOVIMENTACAO,
  type Categoria,
  type Movimentacao,
} from "../../../models/movimentacoes/GetMovimentacoes";
import { ContaContext } from "../../../contexts/ContaContext";
import { useCategorias } from "../../../hooks/useCategorias";
import { useEnvioFormulario } from "../../../hooks/useEnvioFormulario";
import TabelaDados, {
  type ColunaTabela,
} from "../../../componentes/tabela-dados/TabelaDados";
import TituloPagina from "../../../componentes/titulo-pagina/TituloPagina";
import CampoTexto from "../../../props/campo-texto/CampoTexto";
import CampoDataHora from "../../../props/campo-data-hora/CampoDataHora";
import CheckBoxList from "../../../props/check-box-list/CheckBoxList";
import InputPrice from "../../../props/input-price/InputPrice";
import InputSelect from "../../../props/input-select/InputSelect";
import SeletorTipoMovimentacao from "../../../props/seletor-tipo-movimentacao/SeletorTipoMovimentacao";
import {
  formatarMoeda,
  paraIsoUtc,
  periodoDoMes,
} from "../../../utils/formatacao";
import "./MovimentacaoFixa.css";

export type MovimentacaoFixaItem = {
  id: number;
  tipo: number; // tipo de ocorrência (OCORRENCIA)
  dataInicio: string;
  dataFim: string;
  dataOcorrencia: string;
  ocorrenciaDiaria: number[]; // dias da semana (ids de DIAS_SEMANA)
  expirado: boolean;
  movimentacaoBase: Movimentacao;
};

const OCORRENCIA = { Semanal: "0", Mensal: "1", Anual: "2" };
const NOME_OCORRENCIA: Record<number, string> = {
  0: "Semanal",
  1: "Mensal",
  2: "Anual",
};

const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
].map((nome, id) => ({ id, nome }));

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
].map((rotulo, i) => ({ rotulo, valor: String(i + 1) }));

// fevereiro com 28: a data de ocorrência é gravada num ano fixo (ANO_OCORRENCIA)
const DIAS_POR_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const ANO_OCORRENCIA = 2026;
const STATUS_ATIVA = 0;
const STATUS_EXCLUIDA = 1;

// A API devolve as datas das agendadas 3h à frente: volta para o horário de Brasília.
const paraHorarioBrasilia = (iso: string) =>
  new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000);

const doisDigitos = (n: number) => String(n).padStart(2, "0");

// "YYYY-MM-DDTHH:mm" para os campos de data
const dataParaCampo = (iso: string) => {
  if (!iso) return "";
  const d = paraHorarioBrasilia(iso);
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}T${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;
};

// "16/11/2026"; com anual, sem o ano ("16/11")
const formatarData = (iso: string, comAno = true) => {
  if (!iso) return "-";
  const d = paraHorarioBrasilia(iso);
  const diaMes = `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}`;
  return comAno ? `${diaMes}/${d.getFullYear()}` : diaMes;
};

const descreverOcorrencia = (fixa: MovimentacaoFixaItem) => {
  if (fixa.tipo === 0)
    return fixa.ocorrenciaDiaria.map((d) => DIAS_SEMANA[d]?.nome).join(", ");
  if (!fixa.dataOcorrencia) return "-";
  return fixa.tipo === 1
    ? `Dia ${paraHorarioBrasilia(fixa.dataOcorrencia).getDate()}`
    : formatarData(fixa.dataOcorrencia, false);
};

const linhaDaTabela = (fixa: MovimentacaoFixaItem) => ({
  fixa,
  titulo: fixa.movimentacaoBase.titulo,
  tipoMov:
    fixa.movimentacaoBase.tipo === TIPO_MOVIMENTACAO.Receita
      ? "Receita"
      : "Despesa",
  valor: formatarMoeda(fixa.movimentacaoBase.valor),
  tipo: NOME_OCORRENCIA[fixa.tipo] ?? fixa.tipo,
  dataOcorrencia: descreverOcorrencia(fixa),
  dataInicio: formatarData(fixa.dataInicio),
  dataFim: formatarData(fixa.dataFim),
});

type LinhaFixa = ReturnType<typeof linhaDaTabela>;

const COLUNAS: ColunaTabela<LinhaFixa>[] = [
  { titulo: "Titulo", chave: "titulo" },
  { titulo: "Tipo Mov", chave: "tipoMov" },
  { titulo: "Valor", chave: "valor" },
  { titulo: "Tipo", chave: "tipo" },
  { titulo: "Ocorrência", chave: "dataOcorrencia" },
  { titulo: "Início", chave: "dataInicio" },
  { titulo: "Fim", chave: "dataFim" },
];

// Tela "Agendadas": lista as movimentações fixas; clicar numa linha carrega o formulário para edição.
const MovimentacaoFixa: React.FC = () => {
  const { conta } = useContext(ContaContext);
  const idConta = conta!.idConta;
  const { categorias } = useCategorias(idConta);

  const [fixas, setFixas] = useState<MovimentacaoFixaItem[]>([]);
  const [fixasCarregadas, setFixasCarregadas] = useState(false);
  // agendada em edição; null = cadastro
  const [emEdicao, setEmEdicao] = useState<MovimentacaoFixaItem | null>(null);

  const [dataInicial, setDataInicial] = useState(() => periodoDoMes().inicio);
  const [dataFinal, setDataFinal] = useState(() => periodoDoMes().fim);
  const [ocorrencia, setOcorrencia] = useState(OCORRENCIA.Mensal);
  const [mes, setMes] = useState("1");
  const [dia, setDia] = useState("1");
  const [diasSemana, setDiasSemana] = useState<number[]>([1]);
  const [tipo, setTipo] = useState<number>(TIPO_MOVIMENTACAO.Receita);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<
    number[]
  >([]);
  const [titulo, setTitulo] = useState("");
  const [observacao, setObservacao] = useState("");
  const [valor, setValor] = useState(0);

  const diasDoMes = Array.from(
    { length: DIAS_POR_MES[Number(mes) - 1] },
    (_, i) => ({ rotulo: String(i + 1), valor: String(i + 1) }),
  );
  const semanal = ocorrencia === OCORRENCIA.Semanal;
  const rotaFixas = `/Contas/${idConta}/Movimentacoes/Fixa`;

  const buscarFixas = useCallback(
    () =>
      Conecta<{ conteudo: MovimentacaoFixaItem[] }>(rotaFixas, "GET").then(
        (resposta) => {
          if (resposta.sucesso && resposta.dados)
            setFixas(resposta.dados.conteudo ?? []);
          setFixasCarregadas(true);
        },
      ),
    [rotaFixas],
  );

  useEffect(() => {
    buscarFixas();
  }, [buscarFixas]);

  // trocar o mês ajusta o dia quando ele não existe no mês novo (ex.: 31 -> fevereiro)
  const alterarMes = (novoMes: string) => {
    setMes(novoMes);
    const ultimoDia = DIAS_POR_MES[Number(novoMes) - 1];
    if (Number(dia) > ultimoDia) setDia(String(ultimoDia));
  };

  const editar = ({ fixa }: LinhaFixa) => {
    const base = fixa.movimentacaoBase;
    const ocorre = paraHorarioBrasilia(fixa.dataOcorrencia);
    setEmEdicao(fixa);
    setOcorrencia(String(fixa.tipo));
    setDataInicial(dataParaCampo(fixa.dataInicio));
    setDataFinal(dataParaCampo(fixa.dataFim));
    setTitulo(base.titulo);
    setValor(base.valor);
    setObservacao(base.observacao ?? "");
    setCategoriasSelecionadas(base.categorias.map((c) => c.idCategoria));
    setTipo(base.tipo);
    setDia(String(ocorre.getDate()));
    setMes(String(ocorre.getMonth() + 1));
    if (fixa.tipo === 0) setDiasSemana(fixa.ocorrenciaDiaria || []);
  };

  const limparCampos = () => {
    const { inicio, fim } = periodoDoMes();
    setEmEdicao(null);
    setCategoriasSelecionadas([]);
    setTitulo("");
    setObservacao("");
    setValor(0);
    setOcorrencia(OCORRENCIA.Mensal);
    setTipo(TIPO_MOVIMENTACAO.Receita);
    setDataInicial(inicio);
    setDataFinal(fim);
    setMes("1");
    setDia("1");
    setDiasSemana([1]);
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

    if (!emEdicao) {
      const resposta = await Conecta<string>(
        semanal ? `${rotaFixas}/Diarias` : rotaFixas,
        "POST",
        {
          ...recorrencia,
          movimentacao: {
            ...movimentacao,
            idsCategoria: categoriasSelecionadas,
          },
        },
      );
      if (!resposta.sucesso)
        return resposta.erro ?? "Erro ao cadastrar movimentação.";
    } else {
      const respostaRecorrencia = await Conecta<string>(
        `${rotaFixas}/${emEdicao.id}/Alterar${semanal ? "/Diario" : ""}`,
        "PATCH",
        semanal ? recorrencia : { ...recorrencia, status: STATUS_ATIVA },
      );
      if (!respostaRecorrencia.sucesso)
        return respostaRecorrencia.erro ?? "Erro ao editar movimentação.";

      const idMov = emEdicao.movimentacaoBase.id;
      const respostaBase = await Conecta<string>(
        `Contas/Movimentacoes/${idMov}/Alterar`,
        "PATCH",
        movimentacao,
      );
      if (!respostaBase.sucesso)
        return respostaBase.erro ?? "Erro ao editar movimentação.";

      const categoriasOriginais = emEdicao.movimentacaoBase.categorias.map(
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

    await buscarFixas();
    limparCampos();
  };

  const excluir = async () => {
    const resposta = await Conecta<string>(
      `${rotaFixas}/${emEdicao!.id}/Alterar${semanal ? "/Diario" : ""}`,
      "PATCH",
      { status: STATUS_EXCLUIDA },
    );
    if (!resposta.sucesso) return resposta.erro ?? "Erro ao excluir.";
    await buscarFixas();
    limparCampos();
  };

  const envio = useEnvioFormulario(salvar);
  const exclusao = useEnvioFormulario(excluir);
  const ocupado = envio.enviando || exclusao.enviando;
  const erro = envio.erro ?? exclusao.erro;

  return (
    <div className="mf-root">
      <TituloPagina titulo={`Movimentações Agendadas - ${conta!.titulo}`} />

      <section className="mf-section">
        <TabelaDados
          idPreferencias="movimentacoes-fixas"
          linhas={fixas.map(linhaDaTabela)}
          carregando={!fixasCarregadas}
          colunas={COLUNAS}
          onClicarLinha={editar}
        />
      </section>

      <section className="mf-section">
        <h2 className="mf-section-title">Recorrência</h2>
        <div className="mf-group">
          {/* só mensal por enquanto: semanal e anual estavam comentadas (o resto da tela já trata as três) */}
          <InputSelect
            rotulo="Tipo de Ocorrência"
            opcoes={[{ rotulo: "Mensal", valor: OCORRENCIA.Mensal }]}
            valor={ocorrencia}
            setValor={setOcorrencia}
          />
          <CampoDataHora
            rotulo="Data Inicial"
            valor={dataInicial}
            setValor={setDataInicial}
          />
          <CampoDataHora
            rotulo="Data Final"
            valor={dataFinal}
            setValor={setDataFinal}
          />
        </div>

        {ocorrencia === OCORRENCIA.Semanal && (
          <CheckBoxList
            itens={DIAS_SEMANA}
            chaveId="id"
            chaveTexto="nome"
            selecionados={diasSemana}
            setSelecionados={setDiasSemana}
            rotulo="Dias da Semana"
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
          <div className="mf-group">
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
          </div>
        )}
      </section>

      <section className="mf-section">
        <h2 className="mf-section-title">Movimentação</h2>

        <SeletorTipoMovimentacao valor={tipo} setValor={setTipo} />

        <div className="mf-group">
          <CampoTexto
            label="Título"
            valor={titulo}
            setValor={setTitulo}
            placeholder="Ex: Salário"
          />
          <InputPrice rotulo="Valor" valor={valor} setValor={setValor} />
        </div>

        <CampoTexto
          label="Observação"
          valor={observacao}
          setValor={setObservacao}
        />

        <CheckBoxList<Categoria>
          itens={categorias}
          chaveId="idCategoria"
          chaveTexto="nome"
          selecionados={categoriasSelecionadas}
          setSelecionados={setCategoriasSelecionadas}
          rotulo="Categorias"
        />

        {erro && <Alert severity="error">{erro}</Alert>}

        <Button
          variant="contained"
          fullWidth
          onClick={envio.enviar}
          disabled={ocupado}
        >
          {emEdicao ? "Editar Movimentação" : "Cadastrar"}
        </Button>

        {emEdicao && (
          <>
            <Button variant="outlined" onClick={limparCampos} disabled={ocupado}>
              Cancelar Edição
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={exclusao.enviar}
              disabled={ocupado}
            >
              Excluir
            </Button>
          </>
        )}
      </section>
    </div>
  );
};

export default MovimentacaoFixa;
