import { useState, type ReactNode } from "react";
import {
  Divider,
  Icon,
  InputBase,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

// pesquisa sem diferenciar maiúsculas nem acentos ("alimentacao" acha "Alimentação")
const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

type PropTabelaPesquisa<T> = {
  itens: T[];
  chave: (item: T) => React.Key;
  // texto usado na pesquisa
  texto: (item: T) => string;
  titulo: string;
  celula: (item: T) => ReactNode;
  placeholder?: string;
  selecionado?: React.Key | null;
  onSelecionar?: (item: T) => void;
  mensagemVazia?: string;
  alturaMaxima?: number;
};

// Tabela de uma coluna com a pesquisa no topo, no mesmo contorno.
function TabelaPesquisa<T>({
  itens,
  chave,
  texto,
  titulo,
  celula,
  placeholder = "Pesquisar",
  selecionado,
  onSelecionar,
  mensagemVazia = "Nenhum item cadastrado",
  alturaMaxima = 260,
}: PropTabelaPesquisa<T>) {
  const [pesquisa, setPesquisa] = useState("");
  const termo = normalizar(pesquisa.trim());
  const filtrados = itens.filter((i) => normalizar(texto(i)).includes(termo));

  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
      <InputBase
        fullWidth
        value={pesquisa}
        onChange={(e) => setPesquisa(e.target.value)}
        placeholder={placeholder}
        inputProps={{ "aria-label": placeholder }}
        startAdornment={
          <Icon fontSize="small" sx={{ mr: 1, color: "text.secondary" }}>
            search
          </Icon>
        }
        sx={{ px: 1.5, py: 0.75 }}
      />
      <Divider />
      <TableContainer sx={{ maxHeight: alturaMaxima }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>{titulo}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtrados.map((item) => (
              <TableRow
                key={chave(item)}
                hover={Boolean(onSelecionar)}
                selected={selecionado === chave(item)}
                onClick={onSelecionar && (() => onSelecionar(item))}
                sx={{ cursor: onSelecionar ? "pointer" : undefined }}
              >
                <TableCell>{celula(item)}</TableCell>
              </TableRow>
            ))}
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell sx={{ color: "text.secondary" }}>
                  {itens.length === 0 ? mensagemVazia : "Nada encontrado"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default TabelaPesquisa;
