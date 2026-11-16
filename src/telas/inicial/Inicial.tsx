import type { ContaResponse } from "../../models/contas-usuarios/GetContasBancarias";
import api from "../../services/api/apiConnect";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { moverId, ordenarPorIds } from "./ordemContas";
import { useOrdemContas } from "./useOrdemContas";
import { useValoresOcultos } from "../../hooks/useValoresOcultos";

import CadContas from "../contas-bancarias/cad-conta/CadContas";
import ContaComponent from "../contas-bancarias/componente/conta-unitaria/ContaComponent";
import Carregamento from "../../componentes/carregamento/Carregamento";
import ResumoContas from "./ResumoContas";
import "./Inicial.css";

// Tela inicial: patrimônio total e as contas bancárias do usuário.
export const Inicial: React.FC = () => {
  const [contasObtidas, setcontasObtidas] = useState<ContaResponse | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [isCadContaOpen, setIsCadContaOpen] = useState(false);
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
  const buscaContas = async () => {
    setLoading(true);
    const resposta = await api<ContaResponse>("/ContasUsuarios", "GET");

    if (resposta.sucesso && resposta.dados) {
      setcontasObtidas(resposta.dados);
    }
    setLoading(false);
  };

  useEffect(() => {
    buscaContas();
  }, []);

  return (
    <>
      {loading ? (
        <Carregamento />
      ) : (
        <>
          <div className="principal">
            <ResumoContas
              conteudo={contasObtidas?.conteudo}
              onNovaConta={() => setIsCadContaOpen(true)}
              ocultarValores={valoresOcultos}
              onAlternarOcultar={alternarOcultos}
            />

            <div className="grid-cards grid-contas">
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
                  <ContaComponent
                    conta={conta}
                    ocultarValores={valoresOcultos}
                  />
                </div>
              ))}
            </div>

            <CadContas
              aberto={isCadContaOpen}
              onClose={() => setIsCadContaOpen(false)}
              buscaContas={buscaContas}
            />
          </div>
        </>
      )}
    </>
  );
};
