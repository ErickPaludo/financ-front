import { useCallback, useEffect, useState } from "react";

import Conecta from "../services/api/apiConnect";

// GET ao montar (e quando a rota muda); buscar() repete a busca depois de alterar algo.
// carregando só é true até a primeira resposta: atualizar não volta a mostrar o carregamento.
export function useBuscaApi<T>(
  rota: string,
  mensagemErro = "Não foi possível carregar os dados.",
) {
  const [dados, setDados] = useState<T>();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const buscar = useCallback(
    () =>
      Conecta<T>(rota, "GET").then((resposta) => {
        // a API responde 404 quando a lista está vazia ("Nenhum convite foi encontrado!"): é vazio, não erro
        const vazia = resposta.status === 404;
        // falhou ou veio vazia: limpa, para não continuar mostrando o que acabou de ser removido
        setDados(resposta.sucesso ? resposta.dados : undefined);
        setErro(
          resposta.sucesso || vazia ? null : (resposta.erro ?? mensagemErro),
        );
        setCarregando(false);
      }),
    [rota, mensagemErro],
  );

  useEffect(() => {
    buscar();
  }, [buscar]);

  return { dados, erro, carregando, buscar };
}
