import type {
  ContaBancaria,
  ContaResponse,
} from "../../models/contas-usuarios/GetContasBancarias";
import Conecta from "../../services/api/apiConnect";

import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { ContaContext } from "../../contexts/ContaContext";
import { moverId, ordenarPorIds } from "./ordemContas";
import { useOrdemContas } from "./useOrdemContas";
import { useValoresOcultos } from "../../hooks/useValoresOcultos";

import CadContas from "../contas-bancarias/cad-conta/CadContas";
import CardConta from "../contas-bancarias/card-conta/CardConta";
import Carregamento from "../../componentes/carregamento/Carregamento";
import ResumoContas from "./ResumoContas";
import "./Inicial.css";

// Tela inicial: patrimônio total e as contas bancárias do usuário.
export const Inicial: React.FC = () => {
  const [contasObtidas, setContasObtidas] = useState<ContaResponse | null>(
    null,
  );
  const [carregando, setCarregando] = useState(true);
  // a conta continua guardada ao fechar para o título não trocar durante a animação
  const [gaveta, setGaveta] = useState<{
    aberta: boolean;
    conta: ContaBancaria | null;
  }>({ aberta: false, conta: null });
  const { ocultos: valoresOcultos, alternarOcultos } = useValoresOcultos();

  // Ordem dos cards definida pelo usuário arrastando.
  const { user } = useContext(AuthContext);
  const { ids: ordemSalva, salvarOrdem } = useOrdemContas(user?.id);
  const [idArrastando, setIdArrastando] = useState<number | null>(null);
  const contas = ordenarPorIds(
    contasObtidas?.conteudo.contas ?? [],
    ordemSalva,
    (conta) => conta.idConta,
  );

  // Reposiciona enquanto arrasta: o card vai para o lugar do card que está embaixo do cursor.
  const passarPorCima = (idDestino: number) => {
    if (idArrastando === null || idArrastando === idDestino) return;
    salvarOrdem(
      moverId(
        contas.map((conta) => conta.idConta),
        idArrastando,
        idDestino,
      ),
    );
  };
  // a tela de carregamento só aparece na primeira busca (carregando começa true); depois atualiza sem piscar
  const buscaContas = useCallback(
    () =>
      Conecta<ContaResponse>("/ContasUsuarios", "GET").then((resposta) => {
        if (resposta.sucesso && resposta.dados)
          setContasObtidas(resposta.dados);
        setCarregando(false);
      }),
    [],
  );

  useEffect(() => {
    buscaContas();
  }, [buscaContas]);

  // depois de alterar uma conta: atualiza os cards e os favoritos da barra lateral
  const { contasAlteradas } = useContext(ContaContext);
  const atualizarContas = () => {
    buscaContas();
    contasAlteradas();
  };

  return (
    <>
      {carregando ? (
        <Carregamento />
      ) : (
        <>
          <div className="principal">
            <ResumoContas
              conteudo={contasObtidas?.conteudo}
              onNovaConta={() => setGaveta({ aberta: true, conta: null })}
              ocultarValores={valoresOcultos}
              onAlternarOcultar={alternarOcultos}
            />

            <div className="grid-contas">
              {contas.map((conta) => (
                <div
                  key={conta.idConta}
                  draggable
                  className={`conta-arrastavel${idArrastando === conta.idConta ? " conta-arrastando" : ""}`}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", String(conta.idConta)); // o Firefox exige algum dado
                    setIdArrastando(conta.idConta);
                  }}
                  onDragEnter={() => passarPorCima(conta.idConta)}
                  onDragOver={(e) => e.preventDefault()} // permite soltar sobre o card
                  onDrop={(e) => e.preventDefault()}
                  onDragEnd={() => setIdArrastando(null)}
                >
                  <CardConta
                    conta={conta}
                    ocultarValores={valoresOcultos}
                    onEditar={() => setGaveta({ aberta: true, conta })}
                    onAlterada={atualizarContas}
                  />
                </div>
              ))}

              {/* último item: mesmo fluxo do botão "Nova conta bancária" */}
              <button
                type="button"
                className="card-adicionar-conta"
                onClick={() => setGaveta({ aberta: true, conta: null })}
              >
                <span className="card-adicionar-conta__circulo" aria-hidden>
                  <span className="material-icons">add</span>
                </span>
                Adicionar conta
              </button>
            </div>

            <CadContas
              aberto={gaveta.aberta}
              conta={gaveta.conta}
              onClose={() => setGaveta((g) => ({ ...g, aberta: false }))}
              buscaContas={atualizarContas}
            />
          </div>
        </>
      )}
    </>
  );
};
