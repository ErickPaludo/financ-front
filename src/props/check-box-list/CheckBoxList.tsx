import { useState, type ReactNode } from "react";
import {
  Box,
  Checkbox,
  Icon,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Typography,
} from "@mui/material";

import CampoTexto from "../campo-texto/CampoTexto";

interface PropCheckBoxList<T extends object> {
  itens: T[];
  idKey: keyof T;
  labelKey: keyof T;
  selecionados: number[];
  onChange: (ids: number[]) => void;
  label?: string;
  placeholder?: string;
  // o primeiro item (ex.: "Sem categoria") fica fora do "Selecionar tudo"
  ignorarPrimeiroItem?: boolean;
  // troca o campo por outro elemento que abre a lista (ex.: um chip de filtro)
  gatilho?: (p: {
    abrir: (e: React.MouseEvent<HTMLElement>) => void;
    aberto: boolean;
    resumo: string;
  }) => ReactNode;
}

// Seleção múltipla com busca. O campo é um CampoTexto (só leitura) e a lista abre num
// Popover do MUI: segue o tema da página (claro/escuro) e o da gaveta, quando dentro dela.
function CheckBoxList<T extends object>({
  itens,
  idKey,
  labelKey,
  selecionados,
  onChange,
  label,
  placeholder = "Selecione...",
  ignorarPrimeiroItem = false,
  gatilho,
}: PropCheckBoxList<T>) {
  // elemento do campo onde a lista abre; null = fechada
  const [ancora, setAncora] = useState<HTMLElement | null>(null);
  const [busca, setBusca] = useState("");

  const fechar = () => {
    setAncora(null);
    setBusca(""); // ao fechar, a busca volta vazia
  };

  const toggle = (id: number) =>
    onChange(
      selecionados.includes(id)
        ? selecionados.filter((s) => s !== id)
        : [...selecionados, id],
    );

  const idsSelecionaveis = (ignorarPrimeiroItem ? itens.slice(1) : itens).map(
    (item) => item[idKey] as number,
  );
  const todosSelecionados =
    idsSelecionaveis.length > 0 &&
    idsSelecionaveis.every((id) => selecionados.includes(id));
  const algumSelecionado = selecionados.some((id) =>
    idsSelecionaveis.includes(id),
  );

  const toggleTodos = () => onChange(todosSelecionados ? [] : idsSelecionaveis);

  const resumo = () => {
    if (selecionados.length === 0) return "";
    if (todosSelecionados) return "Todos selecionados";
    const nomes = itens
      .filter((item) => selecionados.includes(item[idKey] as number))
      .map((item) => String(item[labelKey]));
    return nomes.length <= 2
      ? nomes.join(", ")
      : `${nomes[0]}, ${nomes[1]} +${nomes.length - 2}`;
  };

  const itensFiltrados = itens.filter((item) =>
    String(item[labelKey]).toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <>
      {gatilho ? (
        gatilho({
          abrir: (e) => setAncora(e.currentTarget),
          aberto: !!ancora,
          resumo: resumo(),
        })
      ) : (
      <CampoTexto
        label={label}
        placeholder={placeholder}
        valor={resumo()}
        setValor={() => {}} // só leitura: o valor vem da seleção
        onClick={(e) => setAncora(e.currentTarget)}
        slotProps={{
          input: {
            readOnly: true,
            sx: { cursor: "pointer", "& input": { cursor: "pointer" } },
            endAdornment: (
              <InputAdornment position="end">
                {selecionados.length > 0 && (
                  <IconButton
                    size="small"
                    aria-label="Limpar seleção"
                    onClick={(e) => {
                      e.stopPropagation(); // não abre a lista
                      onChange([]);
                    }}
                  >
                    <Icon fontSize="small">close</Icon>
                  </IconButton>
                )}
                <Icon>{ancora ? "expand_less" : "expand_more"}</Icon>
              </InputAdornment>
            ),
          },
          htmlInput: { "aria-haspopup": "listbox", "aria-expanded": !!ancora },
        }}
      />
      )}

      <Popover
        open={!!ancora}
        anchorEl={ancora}
        onClose={fechar}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{
          paper: {
            // com gatilho pequeno (chip), a lista não fica mais estreita que 260px
            sx: { width: Math.max(ancora?.offsetWidth ?? 0, 260), maxHeight: 360, mt: 0.5 },
          },
        }}
      >
        {/* busca fixa no topo enquanto a lista rola */}
        <Box
          sx={{
            p: 1,
            position: "sticky",
            top: 0,
            zIndex: 1,
            bgcolor: "background.paper",
          }}
        >
          <CampoTexto
            autoFocus
            placeholder="Pesquisar..."
            valor={busca}
            setValor={setBusca}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon fontSize="small">search</Icon>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <List dense disablePadding role="listbox" aria-multiselectable>
          {!busca && itens.length > 0 && (
            <ListItemButton onClick={toggleTodos}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Checkbox
                  edge="start"
                  size="small"
                  checked={todosSelecionados}
                  indeterminate={algumSelecionado && !todosSelecionados}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemText primary="Selecionar tudo" />
            </ListItemButton>
          )}

          {itensFiltrados.length === 0 && (
            <Typography
              sx={{ p: 2, textAlign: "center", fontSize: 13 }}
              color="text.secondary"
            >
              Nenhum item encontrado
            </Typography>
          )}

          {itensFiltrados.map((item) => {
            const id = item[idKey] as number;
            const marcado = selecionados.includes(id);
            return (
              <ListItemButton
                key={id}
                role="option"
                aria-selected={marcado}
                selected={marcado}
                onClick={() => toggle(id)}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Checkbox
                    edge="start"
                    size="small"
                    checked={marcado}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText primary={String(item[labelKey])} />
              </ListItemButton>
            );
          })}
        </List>
      </Popover>
    </>
  );
}

export default CheckBoxList;
