import type { ContaResponse } from "../../models/contas-usuarios/GetContasBancarias";
import api from "../../services/api/apiConnect";

import { useEffect, useState } from "react";
import Modal from "../../componentes/modal/Modal";

import FncButton from "../../props/fnc-button/FncButton";
import TitleText from "../../props/title-text/TitleText";
import CadContas from "./cad-conta/CadContas";
import PatrimonioTotal from "./componente/patrimonio/PatrimonioTotal";
import ContaComponent from "./componente/conta-unitaria/ContaComponent";
import Carregamento from "../../componentes/carregamento/Carregamento";
import LabelText from "../../props/label-text/LabelText";

type Props = {
  setTelaAtual: React.Dispatch<React.SetStateAction<number>>;
};

const Contas: React.FC<Props> = ({ setTelaAtual }) => {
  const [contasObtidas, setcontasObtidas] = useState<ContaResponse | null>(
    null,
  );
  const [loading, setLoading] = useState<Boolean>(false);
  const [isCadContaOpen, setIsCadContaOpen] = useState(false);
  const retornaBoasVindas = () => {
    const hora = new Date().getHours();
    if (hora >= 22 && hora <= 3)
      return "Vá dormir! Você é corno 🐂 , não morcego... 🦇🦇";
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  };

  const buscaContas = async () => {
    setLoading(true);
    let resposta = await api<ContaResponse>("/ContasUsuarios", "GET");

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
          <div className="menu-superior">
            <div className="texto-superior">
              <LabelText text={retornaBoasVindas()} />
              <TitleText text="Minhas Contas" />
            </div>

            <div>
              <FncButton
                title="Nova Conta Bancaria"
                onClick={() => setIsCadContaOpen(true)}
              />
            </div>
          </div>

          <div className="principal">
            {contasObtidas?.conteudo !== undefined && (
              <PatrimonioTotal contaBancaria={contasObtidas?.conteudo} />
            )}

            <div className="grid-cards">
              {contasObtidas?.conteudo.contas.map((conta) => (
                <ContaComponent
                  key={conta.idConta}
                  setTelaAtual={setTelaAtual}
                  conta={conta}
                  buscaContas={buscaContas}
                />
              ))}
            </div>

            <Modal
              isOpen={isCadContaOpen}
              onClose={() => setIsCadContaOpen(false)}
            >
              <CadContas
                buscaContas={buscaContas}
                onClose={() => setIsCadContaOpen(false)}
              />
            </Modal>
          </div>
        </>
      )}
    </>
  );
};

export default Contas;
