import { useState, type ReactNode } from "react";
import {
  Divider,
  Icon,
  InputAdornment,
  List,
  ListItemButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import CampoTexto from "../../props/campo-texto/CampoTexto";
import { normalizarNome } from "../../utils/formatacao";

type PropListaPesquisa<T> = {
  itens: T[];
  chave: (item: T) => React.Key;
  texto: (item: T) => string; // usado na pesquisa
  item: (item: T, selecionado: boolean) => ReactNode;
  placeholder?: string;
  selecionado?: React.Key | null;
  onSelecionar: (item: T) => void;
  mensagemVazia?: string;
  alturaMaxima?: number;
};

// Lista clicável com pesquisa no topo e contagem, no mesmo contorno.
function ListaPesquisa<T>({
  itens,
  chave,
  texto,
  item,
  placeholder = "Pesquisar",
  selecionado,
  onSelecionar,
  mensagemVazia = "Nenhum item cadastrado",
  alturaMaxima = 280,
}: PropListaPesquisa<T>) {
  const [pesquisa, setPesquisa] = useState("");
  // pesquisa sem diferenciar maiúsculas nem acentos ("alimentacao" acha "Alimentação")
  const termo = normalizarNome(pesquisa);
  const filtrados = itens.filter((i) =>
    normalizarNome(texto(i)).includes(termo),
  );

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
      <Stack spacing={1} sx={{ p: 1.5 }}>
        <CampoTexto
          placeholder={placeholder}
          valor={pesquisa}
          setValor={setPesquisa}
          slotProps={{
            htmlInput: { "aria-label": placeholder },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Icon fontSize="small">search</Icon>
                </InputAdornment>
              ),
            },
          }}
        />
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {termo
            ? `${filtrados.length} de ${itens.length}`
            : `${itens.length} ${itens.length === 1 ? "item" : "itens"}`}
        </Typography>
      </Stack>
      <Divider />

      <List
        dense
        disablePadding
        sx={{ maxHeight: alturaMaxima, overflowY: "auto" }}
      >
        {filtrados.map((i) => {
          const marcado = selecionado === chave(i);
          return (
            <ListItemButton
              key={chave(i)}
              selected={marcado}
              aria-current={marcado || undefined}
              onClick={() => onSelecionar(i)}
              sx={{ py: 1, gap: 1.5 }}
            >
              {item(i, marcado)}
            </ListItemButton>
          );
        })}
        {filtrados.length === 0 && (
          <Typography
            sx={{
              p: 3,
              textAlign: "center",
              fontSize: 13,
              color: "text.secondary",
            }}
          >
            {itens.length === 0 ? mensagemVazia : "Nada encontrado"}
          </Typography>
        )}
      </List>
    </Paper>
  );
}

export default ListaPesquisa;
