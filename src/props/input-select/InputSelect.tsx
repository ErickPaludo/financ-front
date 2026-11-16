import { MenuItem } from "@mui/material";

import CampoTexto from "../campo-texto/CampoTexto";

interface OpcaoSelect {
  label: string;
  value: string;
}

interface PropInputSelect {
  label?: string;
  opcoes: OpcaoSelect[];
  onChange: (value: string) => void;
  placeholder?: string;
  value?: string;
}

// Mantém a API antiga para as telas não mudarem; por dentro é o CampoTexto com select (tema do app).
const InputSelect: React.FC<PropInputSelect> = ({
  label,
  opcoes,
  onChange,
  placeholder,
  value,
}) => (
  <CampoTexto
    select
    label={label}
    valor={value ?? ""}
    setValor={onChange}
    // com placeholder, o valor vazio mostra o texto dele em vez de um campo em branco
    slotProps={placeholder ? { select: { displayEmpty: true } } : undefined}
  >
    {placeholder && (
      <MenuItem value="" disabled>
        {placeholder}
      </MenuItem>
    )}
    {opcoes.map((opcao) => (
      <MenuItem key={opcao.value} value={opcao.value}>
        {opcao.label}
      </MenuItem>
    ))}
  </CampoTexto>
);

export default InputSelect;
