import CampoTexto from "../campo-texto/CampoTexto";
import { formatarMoeda } from "../../utils/formatacao";

interface PropInputPrice {
  rotulo?: string;
  valor: number;
  setValor: (valor: number) => void;
}

// Valor em R$ digitado só com números: "1234" vira R$ 12,34. Zerado, o campo fica vazio (placeholder).
const InputPrice: React.FC<PropInputPrice> = ({ rotulo, valor, setValor }) => (
  <CampoTexto
    placeholder="R$ 00,00"
    label={rotulo}
    valor={valor ? formatarMoeda(valor) : ""}
    setValor={(texto) => setValor(Number(texto.replace(/\D/g, "")) / 100)}
    slotProps={{ htmlInput: { maxLength: 25, inputMode: "numeric" } }}
  />
);

export default InputPrice;
