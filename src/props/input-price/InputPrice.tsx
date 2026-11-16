import CampoTexto from "../campo-texto/CampoTexto";
interface PropInputPrice {
  label?: string;
  formattedValue: string;
  setValue: React.Dispatch<React.SetStateAction<number>>;
  setFormattedValue: React.Dispatch<React.SetStateAction<string>>;
}
const InputPrice: React.FC<PropInputPrice> = ({
  label,
  formattedValue,
  setValue,
  setFormattedValue,
}) => {
  const handleValor = (value: string) => {
    const numeros = value.replace(/\D/g, "");
    const valorNumerico = Number(numeros) / 100;
    const formatado = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valorNumerico);
    setFormattedValue(formatado);
    setValue(valorNumerico);
  };

  return (
    <>
      <CampoTexto
        placeholder="R$ 00,00"
        label={label}
        valor={formattedValue}
        setValor={handleValor}
        slotProps={{ htmlInput: { maxLength: 25, inputMode: "numeric" } }}
      />
    </>
  );
};

export default InputPrice;
