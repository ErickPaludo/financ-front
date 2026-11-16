import InputColor from "../input-color/InputColor";
import CampoTexto from "../campo-texto/CampoTexto";
import "./InputTextAndColorStyle.css";
import LabelText from "../label-text/LabelText";
interface PropInputTextAndColor {
  label?: string;
  color: string;
  onChangeColor: React.Dispatch<React.SetStateAction<string>>;
  placeholder?: string;
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  disable?: boolean;
  maxLenght?: number;
}
const InputTextAndColor: React.FC<PropInputTextAndColor> = ({
  label,
  color,
  onChangeColor,
  placeholder,
  text,
  setText,
  maxLenght,
  disable = false,
}) => {
  return (
    <>
      <div className="fnc-ctn-txt-color">
        {label && <LabelText text={label} />}
        <div className="fnc-input-txt-color">
          <InputColor
            disable={disable}
            color={color}
            onChange={onChangeColor}
          />
          <CampoTexto
            disabled={disable}
            placeholder={placeholder}
            valor={text}
            setValor={setText}
            slotProps={{ htmlInput: { maxLength: maxLenght } }}
          />
        </div>
      </div>
    </>
  );
};

export default InputTextAndColor;
