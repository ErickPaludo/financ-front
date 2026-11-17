import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import {
  lerFiltros,
  paraParametros,
  type FiltrosMovimentacao,
} from "./filtrosUrl";

// Filtros das telas da conta (transações e dashboard) lidos e gravados na URL: recarregar ou
// compartilhar o link mantém período, categorias, status e tipo.
export function useFiltrosUrl() {
  const [parametrosUrl, setParametrosUrl] = useSearchParams();
  const filtros = useMemo(() => lerFiltros(parametrosUrl), [parametrosUrl]);
  // várias mudanças numa chamada só: duas escritas seguidas na URL perdem a primeira;
  // replace: mudar um filtro não cria uma entrada nova no histórico do navegador
  const alterarFiltros = (mudanca: Partial<FiltrosMovimentacao>) =>
    setParametrosUrl(paraParametros({ ...filtros, ...mudanca }), {
      replace: true,
    });
  return { filtros, alterarFiltros };
}
