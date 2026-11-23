import { useContext, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Icon,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";

import { cadastrarMovimentacao } from "../../../services/movimentacoes/movimentacaoService";
import { TIPO_MOVIMENTACAO } from "../../../models/movimentacoes/GetMovimentacoes";
import { ContaContext } from "../../../contexts/ContaContext";
import { useContasMestre } from "../../../hooks/useContasMestre";
import { useEnvioFormulario } from "../../../hooks/useEnvioFormulario";
import CampoTexto from "../../../props/campo-texto/CampoTexto";
import CampoDataHora from "../../../props/campo-data-hora/CampoDataHora";
import InputPrice from "../../../props/input-price/InputPrice";
import InputCheckBox from "../../../props/input-check-box/InputCheckBox";
import SeletorConta from "../../../props/seletor-conta/SeletorConta";
import CheckBoxList from "../../../props/check-box-list/CheckBoxList";
import { useCategorias } from "../../../hooks/useCategorias";
import type { Categoria } from "../../../models/movimentacoes/GetMovimentacoes";
import {
  dataHoraLocal,
  datasMensais,
  paraIsoUtc,
} from "../../../utils/formatacao";
import CampoRepetir from "../../../props/campo-repetir/CampoRepetir";
import { useRepeticao } from "../../../hooks/useRepeticao";

// Categorias de uma das contas (cada conta tem as suas); monta só com a conta escolhida.
const CategoriasDaConta: React.FC<{
  idConta: number;
  selecionadas: number[];
  setSelecionadas: (ids: number[]) => void;
}> = ({ idConta, selecionadas, setSelecionadas }) => {
  const { categorias } = useCategorias(idConta);
  return (
    <CheckBoxList<Categoria>
      itens={categorias}
      chaveId="idCategoria"
      chaveTexto="nome"
      selecionados={selecionadas}
      setSelecionados={setSelecionadas}
      rotulo="Categorias"
    />
  );
};

// Transferência entre a conta aberta e outra em que o usuário é mestre ou administrador: uma Despesa
// na conta de origem e uma Receita na de destino (um POST em cada), mesma data, valor e conclusão.
const CadTransferencia: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { conta } = useContext(ContaContext);
  const contaAtual = conta!;
  const outras = useContasMestre(true)?.filter(
    (c) => c.idConta !== contaAtual.idConta,
  );

  // a conta aberta fica fixa e começa como origem; o botão do meio inverte
  const [saiDaAtual, setSaiDaAtual] = useState(true);
  const [idOutra, setIdOutra] = useState<number | null>(null);
  const [categoriasAtual, setCategoriasAtual] = useState<number[]>([]);
  const [categoriasOutra, setCategoriasOutra] = useState<number[]>([]);
  const [titulo, setTitulo] = useState("Transferência");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);
  const [dataMovimentacao, setDataMovimentacao] = useState(() =>
    dataHoraLocal(),
  );
  const [dataConclusao, setDataConclusao] = useState(() => dataHoraLocal());
  const [marcouConcluido, setConcluido] = useState(false);
  const repeticao = useRepeticao(dataMovimentacao);
  // transferências repetidas saem todas pendentes: cada uma é concluída quando acontecer
  const concluido = marcouConcluido && !repeticao.repetir;
  // quantos POSTs já deram certo: se um falhar, enviar de novo continua dele, sem duplicar
  const criadas = useRef(0);

  const outra = outras?.find((c) => c.idConta === idOutra);
  const de = saiDaAtual ? contaAtual : outra;
  const para = saiDaAtual ? outra : contaAtual;
  const categoriasDe = saiDaAtual ? categoriasAtual : categoriasOutra;
  const categoriasPara = saiDaAtual ? categoriasOutra : categoriasAtual;

  // observação: a outra conta da transferência e, depois, a descrição digitada (limite de 255 da API)
  const observacao = (texto: string) =>
    (descricao.trim() ? `${texto} · ${descricao.trim()}` : texto).slice(0, 255);

  const enviarPost = (
    idConta: number,
    tipo: number,
    obs: string,
    idsCategoria: number[],
    data: string,
    conclui: boolean,
  ) =>
    cadastrarMovimentacao(idConta, {
      tipo,
      valor,
      concluido: conclui,
      titulo,
      observacao: obs,
      dthrMovimentacao: paraIsoUtc(data),
      dthrConclusao: conclui ? paraIsoUtc(dataConclusao) : null,
      idsCategoria,
    });

  const transferir = async () => {
    if (!de || !para) return "Escolha a outra conta.";
    if (valor <= 0) return "Informe um valor maior que zero.";
    if (!titulo.trim()) return "Informe o título.";
    if (repeticao.erro) return repeticao.erro;
    const lados = [
      {
        conta: de,
        tipo: TIPO_MOVIMENTACAO.Despesa,
        obs: observacao(`Transferência para a conta ${para.titulo}`),
        categorias: categoriasDe,
      },
      {
        conta: para,
        tipo: TIPO_MOVIMENTACAO.Receita,
        obs: observacao(`Transferência da conta ${de.titulo}`),
        categorias: categoriasPara,
      },
    ];
    // por mês: saída e entrada, em sequência
    const datas = datasMensais(dataMovimentacao, repeticao.vezes);
    const posts = datas.flatMap((data) =>
      lados.map((lado) => ({ ...lado, data, conclui: concluido })),
    );
    for (let i = criadas.current; i < posts.length; i++) {
      const { conta, tipo, obs, categorias, data, conclui } = posts[i];
      const resposta = await enviarPost(
        conta.idConta,
        tipo,
        obs,
        categorias,
        data,
        conclui,
      );
      if (!resposta.sucesso)
        return `${i} de ${posts.length} movimentações criadas (falhou em "${conta.titulo}"). ${resposta.erro ?? "Erro ao cadastrar movimentação."} Envie de novo para criar as que faltam.`;
      criadas.current = i + 1;
    }
    onClose();
  };

  const envio = useEnvioFormulario(transferir);
  const carregando = !outras;

  const campoAtual = (
    <Stack spacing={1.5}>
      <SeletorConta
        contas={[contaAtual]}
        valor={contaAtual.idConta}
        setValor={() => {}}
        rotulo={saiDaAtual ? "Sai de (despesa)" : "Entra em (receita)"}
        bloqueado
      />
      <CategoriasDaConta
        idConta={contaAtual.idConta}
        selecionadas={categoriasAtual}
        setSelecionadas={setCategoriasAtual}
      />
    </Stack>
  );
  const campoOutra = (
    <Stack spacing={1.5}>
      <SeletorConta
        contas={outras ?? []}
        valor={idOutra}
        setValor={(id) => {
          setIdOutra(id);
          setCategoriasOutra([]); // as categorias marcadas eram da conta anterior
        }}
        rotulo={
          carregando
            ? "Carregando contas..."
            : saiDaAtual
              ? "Entra em (receita)"
              : "Sai de (despesa)"
        }
      />
      {idOutra !== null && (
        <CategoriasDaConta
          key={idOutra}
          idConta={idOutra}
          selecionadas={categoriasOutra}
          setSelecionadas={setCategoriasOutra}
        />
      )}
    </Stack>
  );

  return (
    <Stack component="form" onSubmit={envio.enviar} noValidate spacing={1.5}>
      {outras?.length === 0 && (
        <Alert severity="info">
          Você não é mestre nem administrador de outra conta ativa.
        </Alert>
      )}

      {saiDaAtual ? campoAtual : campoOutra}
      <Box sx={{ display: "flex", justifyContent: "center", my: -0.5 }}>
        <Tooltip title="Inverter contas">
          <IconButton
            aria-label="Inverter contas"
            onClick={() => setSaiDaAtual((atual) => !atual)}
          >
            <Icon>swap_vert</Icon>
          </IconButton>
        </Tooltip>
      </Box>
      {saiDaAtual ? campoOutra : campoAtual}

      <CampoTexto label="Título" valor={titulo} setValor={setTitulo} />

      <CampoTexto
        label="Descrição"
        valor={descricao}
        setValor={setDescricao}
        slotProps={{ htmlInput: { maxLength: 255 } }}
      />

      <InputPrice rotulo="Valor (R$)" valor={valor} setValor={setValor} />

      <CampoDataHora
        rotulo="Data movimentação"
        valor={dataMovimentacao}
        setValor={(data) => {
          setDataMovimentacao(data);
          setDataConclusao(data);
        }}
      />

      <CampoRepetir
        repeticao={repeticao}
        texto={(vezes) =>
          `${vezes} transferências, uma por mês (${vezes * 2} movimentações)`
        }
      />

      {!repeticao.repetir && (
        <InputCheckBox
          rotulo="Transferência concluída"
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
        disabled={envio.enviando || !outras?.length}
      >
        {envio.enviando ? "Transferindo..." : "Transferir"}
      </Button>
    </Stack>
  );
};

export default CadTransferencia;
