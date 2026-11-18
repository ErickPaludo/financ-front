import { Stack } from "@mui/material";

import type { Categoria } from "../../../models/categorias/Categorias";
import CheckBoxList from "../../../props/check-box-list/CheckBoxList";
import {
  OPCOES_STATUS,
  OPCOES_TIPO,
  type FiltrosMovimentacao,
} from "../filtrosUrl";
import { ChipFiltro, ChipSelect } from "./ChipFiltro";

const SEM_CATEGORIA: Categoria = {
  idCategoria: 0,
  nome: "Sem categoria",
  cor: "",
};

type PropChipsFiltros = {
  categorias: Categoria[];
  filtros: FiltrosMovimentacao;
  alterarFiltros: (mudanca: Partial<FiltrosMovimentacao>) => void;
};

// Chips "Categorias", "Status" e "Tipo" das telas da conta (transações e dashboard).
const ChipsFiltros: React.FC<PropChipsFiltros> = ({
  categorias,
  filtros,
  alterarFiltros,
}) => (
  <Stack
    direction="row"
    sx={{ flexWrap: "wrap", alignItems: "center", gap: 1 }}
  >
    <CheckBoxList<Categoria>
      itens={[SEM_CATEGORIA, ...categorias]}
      chaveId="idCategoria"
      chaveTexto="nome"
      selecionados={filtros.categorias}
      setSelecionados={(selecionadas) =>
        alterarFiltros({ categorias: selecionadas })
      }
      rotulo="Categorias"
      ignorarPrimeiroItem
      gatilho={({ abrir, aberto, resumo }) => (
        <ChipFiltro
          texto={resumo ? `Categorias: ${resumo}` : "Categorias"}
          aberto={aberto}
          onClick={abrir}
          onLimpar={
            filtros.categorias.length > 0
              ? () => alterarFiltros({ categorias: [] })
              : undefined
          }
        />
      )}
    />
    <ChipSelect
      rotulo="Status"
      opcoes={OPCOES_STATUS}
      valor={filtros.status}
      setValor={(valor) =>
        alterarFiltros({ status: valor as FiltrosMovimentacao["status"] })
      }
    />
    <ChipSelect
      rotulo="Tipo"
      opcoes={OPCOES_TIPO}
      valor={filtros.tipo}
      setValor={(valor) =>
        alterarFiltros({ tipo: valor as FiltrosMovimentacao["tipo"] })
      }
    />
  </Stack>
);

export default ChipsFiltros;
