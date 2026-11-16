import CampoTexto from "../campo-texto/CampoTexto";

interface PropInputDate {
  label?: string;
  text: string;
  setText: (value: string) => void;
}
const InputDate: React.FC<PropInputDate> = ({ label, text, setText }) => (
  <CampoTexto
    type="datetime-local"
    label={label}
    valor={text}
    setValor={setText}
  />
);

export default InputDate;
