import { MenuItem } from "@mui/material";

import CampoTexto from "../campo-texto/CampoTexto";

export interface OpcaoSelect {
  rotulo: string;
  valor: string;
}

interface PropInputSelect {
  rotulo?: string;
  opcoes: OpcaoSelect[];
  valor?: string;
  setValor: (valor: string) => void;
  placeholder?: string;
}

// Lista de escolha única: CampoTexto com select (tema do app).
const InputSelect: React.FC<PropInputSelect> = ({
  rotulo,
  opcoes,
  valor,
  setValor,
  placeholder,
}) => (
  <CampoTexto
    select
    label={rotulo}
    valor={valor ?? ""}
    setValor={setValor}
    // com placeholder, o valor vazio mostra o texto dele em vez de um campo em branco
    slotProps={placeholder ? { select: { displayEmpty: true } } : undefined}
  >
    {placeholder && (
      <MenuItem value="" disabled>
        {placeholder}
      </MenuItem>
    )}
    {opcoes.map((opcao) => (
      <MenuItem key={opcao.valor} value={opcao.valor}>
        {opcao.rotulo}
      </MenuItem>
    ))}
  </CampoTexto>
);

export default InputSelect;
