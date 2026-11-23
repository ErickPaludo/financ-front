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

import {
  lerArquivos,
  type ArquivoLido,
} from "../../../services/movimentacoes/importacao/leitorCsv";
import {
  sugerirMapa,
  type Campo,
  type Mapa,
} from "../../../services/movimentacoes/importacao/mapeamentoColunas";
import {
  converterArquivos,
  type TipoArquivo,
} from "../../../services/movimentacoes/importacao/conversaoMovimentacoes";
import { importarMovimentacoes } from "../../../services/movimentacoes/importacao/importacaoService";
import { ContaContext } from "../../../contexts/ContaContext";
import { useEnvioFormulario } from "../../../hooks/useEnvioFormulario";
import InputSelect from "../../../props/input-select/InputSelect";
import CheckBoxList from "../../../props/check-box-list/CheckBoxList";
import TituloSecao from "../../../componentes/titulo-secao/TituloSecao";
import { useCategorias } from "../../../hooks/useCategorias";
import type { Categoria } from "../../../models/movimentacoes/GetMovimentacoes";
import { estiloBotaoSecundario } from "../../../estilos";
import CampoDataHora from "../../../props/campo-data-hora/CampoDataHora";
import {
  dataHoraLocal,
  formatarData,
  formatarMoeda,
} from "../../../utils/formatacao";

const OPCOES_TIPO = [
  { rotulo: "Fatura do cartão de crédito", valor: "credito" },
  { rotulo: "Extrato da conta (débito)", valor: "debito" },
];

// a ordem dos campos na tela; descrição é a única opcional
const CAMPOS: { campo: Campo; rotulo: string }[] = [
  { campo: "titulo", rotulo: "Título" },
  { campo: "valor", rotulo: "Valor" },
  { campo: "data", rotulo: "Data" },
  { campo: "descricao", rotulo: "Descrição (opcional)" },
];

// aba anônima pode bloquear o localStorage: a escolha só não fica salva
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
const lerJson = <T,>(chave: string): T | null => {
  try {
    return JSON.parse(lerSalvo(chave) ?? "null") as T;
  } catch {
    return null;
  }
};

// última importação da conta: o tipo e o nome da coluna de cada campo
type Salvo = {
  tipo: TipoArquivo;
  colunas: Partial<Record<Campo, string | null>>;
};

// Importa um CSV com cabeçalho (fatura do cartão ou extrato da conta): o usuário diz qual coluna
// é cada campo. Uma movimentação pendente por linha: no extrato, na data da linha; na fatura,
// todas na data escolhida (a da fatura).
const ImportarCsv: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { conta } = useContext(ContaContext);
  const { categorias } = useCategorias(conta!.idConta);
  // tipo, colunas e categorias são do banco/cartão: ficam salvos por conta
  const chaveCategorias = `categoriasImportacao:${conta!.idConta}`;
  const chaveColunas = `importacaoCsv:${conta!.idConta}`;
  const [salvo] = useState(() => lerJson<Salvo>(chaveColunas));
  const [tipo, setTipo] = useState<TipoArquivo>(
    salvo?.tipo === "debito" ? "debito" : "credito",
  );
  const [idsSalvos, setIdsSalvos] = useState<number[]>(() => {
    const ids = lerJson<unknown>(chaveCategorias);
    return Array.isArray(ids) ? ids.filter(Number.isInteger) : [];
  });
  // categoria apagada depois de salva não vai para a API
  const idsCategoria = idsSalvos.filter((id) =>
    categorias.some((c) => c.idCategoria === id),
  );
  const alterarCategorias = (ids: number[]) => {
    setIdsSalvos(ids);
    salvar(chaveCategorias, JSON.stringify(ids));
  };
  const [arquivo, setArquivo] = useState<ArquivoLido | null>(null);
  const [mapa, setMapa] = useState<Mapa | null>(null);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [feitas, setFeitas] = useState(0);
  // quantos POSTs já deram certo: se um falhar, enviar de novo continua dele, sem duplicar
  const criadas = useRef(0);

  const guardar = (novoTipo: TipoArquivo, novoMapa: Mapa | null) => {
    const colunas = arquivo?.colunas ?? [];
    const nome = (i: number | null) => (i === null ? null : colunas[i]);
    salvar(
      chaveColunas,
      JSON.stringify({
        tipo: novoTipo,
        colunas: novoMapa
          ? {
              titulo: nome(novoMapa.titulo),
              valor: nome(novoMapa.valor),
              data: nome(novoMapa.data),
              descricao: nome(novoMapa.descricao),
            }
          : (salvo?.colunas ?? {}),
      } satisfies Salvo),
    );
  };
  const alterarTipo = (valor: string) => {
    const novo = valor as TipoArquivo;
    setTipo(novo);
    guardar(novo, mapa);
  };
  const alterarColuna = (campo: Campo, valor: string) => {
    if (!mapa) return;
    const novo = { ...mapa, [campo]: valor === "" ? null : Number(valor) };
    setMapa(novo);
    guardar(tipo, novo);
  };

  const credito = tipo === "credito";
  // fatura: todas as compras entram nesta data (pedido do usuário)
  const [dataFatura, setDataFatura] = useState(() => dataHoraLocal());
  const lido =
    arquivo && mapa ? converterArquivos(arquivo.partes, mapa, tipo) : null;
  const erroLeitura = lido && "erro" in lido ? lido.erro : null;
  const linhas = lido && "linhas" in lido ? lido.linhas : [];
  const ignoradas = lido && "ignoradas" in lido ? lido.ignoradas : 0;
  const receitas = linhas.filter((linha) => linha.receita);
  const saldo = linhas.reduce(
    (soma, linha) => soma + (linha.receita ? linha.valor : -linha.valor),
    0,
  );

  const escolherArquivo = async (
    evento: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const escolhidos = [...(evento.target.files ?? [])];
    evento.target.value = ""; // escolher os mesmos arquivos de novo dispara o onChange
    if (!escolhidos.length) return;
    const lido = lerArquivos(
      await Promise.all(
        escolhidos.map(async (f) => ({ nome: f.name, texto: await f.text() })),
      ),
    );
    criadas.current = 0;
    setFeitas(0);
    setArquivo(null);
    setMapa(null);
    if ("erro" in lido) return setErroArquivo(lido.erro);
    setArquivo(lido);
    // a escolha mais recente, mesmo desta abertura
    setMapa(sugerirMapa(lido.colunas, lerJson<Salvo>(chaveColunas)?.colunas));
    setErroArquivo(null);
  };

  const importar = async () => {
    if (erroLeitura) return erroLeitura;
    if (!linhas.length) return "Escolha um arquivo com movimentações.";
    const resultado = await importarMovimentacoes(
      conta!.idConta,
      linhas,
      { tipo, dataFatura, idsCategoria },
      { aPartirDe: criadas.current, aoCriar: setFeitas },
    );
    criadas.current = resultado.criadas;
    if (resultado.erro) return resultado.erro;
    onClose();
  };

  const envio = useEnvioFormulario(importar);
  const opcoesColuna = (arquivo?.colunas ?? []).map((nome, i) => ({
    rotulo: nome || `Coluna ${i + 1}`,
    valor: String(i),
  }));

  return (
    <Stack component="form" onSubmit={envio.enviar} noValidate spacing={1.5}>
      <InputSelect
        rotulo="Tipo do arquivo"
        opcoes={OPCOES_TIPO}
        valor={tipo}
        setValor={alterarTipo}
      />

      {credito && (
        <CampoDataHora
          rotulo="Data da fatura (todas as compras entram nela)"
          valor={dataFatura}
          setValor={setDataFatura}
        />
      )}

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
          : arquivo.partes.length === 1
            ? `Arquivo: ${arquivo.partes[0].nome}`
            : `${arquivo.partes.length} arquivos`}
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

      {arquivo && mapa && (
        <>
          <TituloSecao semRecuo>Colunas do arquivo</TituloSecao>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 1.5,
            }}
          >
            {CAMPOS.map(({ campo, rotulo }) => (
              <InputSelect
                key={campo}
                rotulo={rotulo}
                opcoes={
                  campo === "descricao"
                    ? [{ rotulo: "Nenhuma", valor: "" }, ...opcoesColuna]
                    : opcoesColuna
                }
                valor={mapa[campo] === null ? "" : String(mapa[campo])}
                setValor={(valor) => alterarColuna(campo, valor)}
                placeholder={campo === "descricao" ? undefined : "Escolha"}
              />
            ))}
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {credito
              ? "Na fatura, valor positivo é gasto e negativo é reembolso; o pagamento da fatura fica de fora."
              : "No extrato, valor negativo é despesa e positivo é receita."}
          </Typography>
        </>
      )}

      {erroLeitura && <Alert severity="error">{erroLeitura}</Alert>}

      {linhas.length > 0 && (
        <>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {linhas.length - receitas.length} despesa(s) · {receitas.length}{" "}
            receita(s) · saldo {formatarMoeda(saldo)}
            {ignoradas > 0 && ` · ${ignoradas} ignorada(s)`}
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
                  <TableCell>{credito ? "Compra → fatura" : "Data"}</TableCell>
                  <TableCell align="right">Valor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {linhas.map((linha, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      {linha.titulo}
                      {linha.descricao && (
                        <Typography
                          variant="caption"
                          component="div"
                          sx={{ color: "text.secondary" }}
                        >
                          {linha.descricao}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatarData(linha.data)}
                      {credito && ` → ${formatarData(dataFatura)}`}
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
