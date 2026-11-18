import type {
  ContaBancaria,
  ContaResponse,
} from "../../models/contas-usuarios/GetContasBancarias";

import { useContext, useState } from "react";
import { useBuscaApi } from "../../hooks/useBuscaApi";
import { AuthContext } from "../../contexts/AuthContext";
import { ContaContext } from "../../contexts/ContaContext";
import { useOrdemArrastavel } from "../../hooks/useOrdemArrastavel";
import { useValoresOcultos } from "../../hooks/useValoresOcultos";

import CadContas from "../contas-bancarias/cad-conta/CadContas";
import CardConta from "../contas-bancarias/card-conta/CardConta";
import Carregamento from "../../componentes/carregamento/Carregamento";
import ResumoContas from "./ResumoContas";
import "./Inicial.css";

// Tela inicial: patrimônio total e as contas bancárias do usuário.
export const Inicial: React.FC = () => {
  // a tela de carregamento só aparece na primeira busca; depois atualiza sem piscar
  const {
    dados: contasObtidas,
    carregando,
    buscar: buscaContas,
  } = useBuscaApi<ContaResponse>("/ContasUsuarios");
  // a conta continua guardada ao fechar para o título não trocar durante a animação
  const [gaveta, setGaveta] = useState<{
    aberta: boolean;
    conta: ContaBancaria | null;
  }>({ aberta: false, conta: null });
  const { ocultos: valoresOcultos, alternarOcultos } = useValoresOcultos();

  // Ordem dos cards definida pelo usuário arrastando.
  const { user } = useContext(AuthContext);
  const {
    ordenados: contas,
    arrastando: idArrastando,
    propsArrastar,
  } = useOrdemArrastavel(
    `ordemContas:${user?.id ?? "anonimo"}`,
    contasObtidas?.conteudo.contas ?? [],
    (conta) => conta.idConta,
  );
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
                  {...propsArrastar(conta.idConta)}
                  className={`conta-arrastavel${idArrastando === conta.idConta ? " conta-arrastando" : ""}`}
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
