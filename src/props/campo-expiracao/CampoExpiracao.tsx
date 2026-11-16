import CampoTexto from "../campo-texto/CampoTexto";
import InputCheckBox from "../input-check-box/InputCheckBox";

type PropCampoExpiracao = {
  ativo: boolean;
  setAtivo: (ativo: boolean) => void;
  minutos: string;
  setMinutos: (minutos: string) => void;
};

// "Tempo de expiração" do acesso à conta: o campo de minutos só aparece com a caixa marcada.
const CampoExpiracao: React.FC<PropCampoExpiracao> = ({
  ativo,
  setAtivo,
  minutos,
  setMinutos,
}) => (
  <>
    <InputCheckBox
      rotulo="Tempo de expiração"
      marcado={ativo}
      setMarcado={setAtivo}
    />
    {ativo && (
      <CampoTexto
        label="Tempo de expiração em minutos"
        valor={minutos}
        setValor={setMinutos}
        type="number"
      />
    )}
  </>
);

export default CampoExpiracao;
