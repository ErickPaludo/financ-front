import { useContext, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Icon,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import Conecta from "../../../services/api/apiConnect";
import { TIPO_MOVIMENTACAO } from "../../../models/movimentacoes/GetMovimentacoes";
import type { MovimentacaoPost } from "../../../models/movimentacoes/MovimentacaoPost";
import { ContaContext } from "../../../contexts/ContaContext";
import { useEnvioFormulario } from "../../../hooks/useEnvioFormulario";
import CampoTexto from "../../../props/campo-texto/CampoTexto";
import InputSelect from "../../../props/input-select/InputSelect";
import CheckBoxList from "../../../props/check-box-list/CheckBoxList";
import { useCategorias } from "../../../hooks/useCategorias";
import type { Categoria } from "../../../models/movimentacoes/GetMovimentacoes";
import { estiloBotaoSecundario } from "../../../estilos";
import {
  formatarData,
  formatarMoeda,
  paraIsoUtc,
} from "../../../utils/formatacao";
import {
  dataDaFatura,
  lerCsvNubank,
  type LinhaNubank,
} from "./importacaoNubank";

const OPCOES_TIPO = [
  { rotulo: "Cartão de crédito", valor: "credito" },
  { rotulo: "Débito (em breve)", valor: "debito", desabilitado: true },
];

const validarDia = (dia: string) =>
  /^\d+$/.test(dia) && Number(dia) >= 1 && Number(dia) <= 28
    ? null
    : "Informe um dia entre 1 e 28.";

// Importa a fatura do cartão do Nubank (CSV): Despesa por compra e Receita por reembolso, pendentes, na data da fatura.
// aba anônima pode bloquear o localStorage: o campo só não fica salvo
const lerSalvo = (chave: string) => {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
};
const salvar = (chave: string, valor: string) => {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // sem localStorage, segue sem salvar
  }
};

const ImportarCsv: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { conta } = useContext(ContaContext);
  const [tipo, setTipo] = useState("credito");
  const { categorias } = useCategorias(conta!.idConta);
  // dia da virada e categorias são do cartão: ficam salvos por conta para a próxima importação
  const chaveDia = `diaViradaFatura:${conta!.idConta}`;
  const chaveCategorias = `categoriasImportacao:${conta!.idConta}`;
  // valem para todas as movimentações importadas
  const [idsSalvos, setIdsSalvos] = useState<number[]>(() => {
    const salvo = lerSalvo(chaveCategorias);
    try {
      const ids: unknown = salvo ? JSON.parse(salvo) : [];
      return Array.isArray(ids) ? ids.filter(Number.isInteger) : [];
    } catch {
      return [];
    }
  });
  // categoria apagada depois de salva não vai para a API
  const idsCategoria = idsSalvos.filter((id) =>
    categorias.some((c) => c.idCategoria === id),
  );
  const alterarCategorias = (ids: number[]) => {
    setIdsSalvos(ids);
    salvar(chaveCategorias, JSON.stringify(ids));
  };
  const [diaVirada, setDiaVirada] = useState(() => lerSalvo(chaveDia) ?? "");
  const alterarDia = (dia: string) => {
    setDiaVirada(dia);
    salvar(chaveDia, dia);
  };
  const [arquivo, setArquivo] = useState<{
    nomes: string[];
    linhas: LinhaNubank[];
    ignoradas: number;
  } | null>(null);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [feitas, setFeitas] = useState(0);
  // quantos POSTs já deram certo: se um falhar, enviar de novo continua dele, sem duplicar
  const criadas = useRef(0);

  const diaValido = !validarDia(diaVirada);
  const linhas = arquivo?.linhas ?? [];
  const comData = linhas.map((linha) => ({
    ...linha,
    fatura: diaValido ? dataDaFatura(linha.data, Number(diaVirada)) : null,
  }));
  const reembolsos = linhas.filter((linha) => linha.receita).length;
  // líquido da importação: gastos menos reembolsos
  const total = linhas.reduce(
    (soma, linha) => soma + (linha.receita ? -linha.valor : linha.valor),
    0,
  );

  const escolherArquivo = async (
    evento: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const escolhidos = [...(evento.target.files ?? [])];
    evento.target.value = ""; // escolher os mesmos arquivos de novo dispara o onChange
    if (!escolhidos.length) return;
    const lidos = await Promise.all(
      escolhidos.map(async (f) => ({
        nome: f.name,
        lido: lerCsvNubank(await f.text()),
      })),
    );
    criadas.current = 0;
    setFeitas(0);
    // um arquivo inválido barra todos: melhor corrigir a escolha do que importar só parte
    const erros = lidos.flatMap(({ nome, lido }) =>
      "erro" in lido ? [`${nome}: ${lido.erro}`] : [],
    );
    if (erros.length) {
      setArquivo(null);
      setErroArquivo(erros.join("\n"));
      return;
    }
    setArquivo({
      nomes: lidos.map(({ nome }) => nome),
      linhas: lidos.flatMap(({ lido }) =>
        "linhas" in lido ? lido.linhas : [],
      ),
      ignoradas: lidos.reduce(
        (soma, { lido }) => soma + ("ignoradas" in lido ? lido.ignoradas : 0),
        0,
      ),
    });
    setErroArquivo(null);
  };

  const importar = async () => {
    if (!diaValido) return "Informe o dia da virada da fatura.";
    if (!linhas.length) return "Escolha um arquivo com movimentações.";
    for (let i = criadas.current; i < comData.length; i++) {
      const { titulo, valor, receita, data, fatura } = comData[i];
      const resposta = await Conecta<unknown>(
        `/Contas/${conta!.idConta}/Movimentacoes`,
        "POST",
        {
          tipo: receita ? TIPO_MOVIMENTACAO.Receita : TIPO_MOVIMENTACAO.Despesa,
          valor,
          concluido: false,
          titulo,
          observacao: `Importado do Nubank · ${receita ? "reembolso" : "compra"} em ${formatarData(data)}`,
          dthrMovimentacao: paraIsoUtc(fatura!),
          dthrConclusao: null,
          idsCategoria,
        } satisfies MovimentacaoPost,
      );
      if (!resposta.sucesso)
        return `${i} de ${comData.length} movimentações criadas (falhou em "${titulo}"). ${resposta.erro ?? "Erro ao cadastrar movimentação."} Envie de novo para criar as que faltam.`;
      criadas.current = i + 1;
      setFeitas(i + 1);
    }
    onClose();
  };

  const envio = useEnvioFormulario(importar);

  return (
    <Stack component="form" onSubmit={envio.enviar} noValidate spacing={1.5}>
      <InputSelect
        rotulo="Tipo do arquivo"
        opcoes={OPCOES_TIPO}
        valor={tipo}
        setValor={setTipo}
      />

      <CampoTexto
        label="Dia da virada da fatura"
        type="number"
        valor={diaVirada}
        setValor={alterarDia}
        validar={validarDia}
        mostrarErro={envio.tentouEnviar || diaVirada !== ""}
        helperText="Compras antes deste dia ficam na fatura do mês; a partir dele, na do mês seguinte. A data lançada é o dia anterior à virada."
        slotProps={{ htmlInput: { min: 1, max: 28 } }}
        disabled={envio.enviando}
      />

      <CheckBoxList<Categoria>
        itens={categorias}
        chaveId="idCategoria"
        chaveTexto="nome"
        selecionados={idsCategoria}
        setSelecionados={alterarCategorias}
        rotulo="Categorias (para todas as importadas)"
      />

      <Button
        component="label"
        startIcon={<Icon>upload_file</Icon>}
        sx={estiloBotaoSecundario}
        disabled={envio.enviando}
      >
        {!arquivo
          ? "Escolher arquivos CSV"
          : arquivo.nomes.length === 1
            ? `Arquivo: ${arquivo.nomes[0]}`
            : `${arquivo.nomes.length} arquivos`}
        <input
          type="file"
          accept=".csv,text/csv"
          multiple
          hidden
          onChange={escolherArquivo}
        />
      </Button>

      {erroArquivo && (
        <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>
          {erroArquivo}
        </Alert>
      )}

      {arquivo && (
        <>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {linhas.length - reembolsos} gastos
            {reembolsos > 0 && ` · ${reembolsos} reembolso(s)`} · total{" "}
            {formatarMoeda(total)}
            {arquivo.ignoradas > 0 &&
              ` · ${arquivo.ignoradas} pagamento(s) da fatura ignorado(s)`}
          </Typography>
          <Box
            sx={{
              maxHeight: 360,
              overflow: "auto",
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Compra → fatura</TableCell>
                  <TableCell align="right">Valor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comData.map((linha, i) => (
                  <TableRow key={i}>
                    <TableCell>{linha.titulo}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatarData(linha.data)} →{" "}
                      {linha.fatura ? formatarData(linha.fatura) : "?"}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        whiteSpace: "nowrap",
                        color: linha.receita ? "success.main" : undefined,
                      }}
                    >
                      {linha.receita && "+ "}
                      {formatarMoeda(linha.valor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}

      {envio.enviando && (
        <Box aria-live="polite">
          <Typography variant="body2" sx={{ mb: 1 }}>
            {feitas} de {linhas.length}…
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(feitas / linhas.length) * 100}
            aria-label="Progresso"
          />
        </Box>
      )}

      {envio.erro && <Alert severity="error">{envio.erro}</Alert>}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={envio.enviando || !linhas.length}
      >
        {envio.enviando
          ? "Importando..."
          : linhas.length
            ? `Importar ${linhas.length} movimentações`
            : "Importar"}
      </Button>
    </Stack>
  );
};

export default ImportarCsv;
