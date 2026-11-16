import { Checkbox, FormControlLabel } from "@mui/material";

interface PropInputCheckBox {
  rotulo: string;
  marcado: boolean;
  setMarcado: (marcado: boolean) => void;
}

// Checkbox do MUI com o texto ao lado, na cor de apoio da tela.
const InputCheckBox: React.FC<PropInputCheckBox> = ({
  rotulo,
  marcado,
  setMarcado,
}) => (
  <FormControlLabel
    sx={{ width: "100%", m: 0 }}
    label={rotulo}
    control={
      <Checkbox
        size="small"
        // desmarcado na mesma cor do texto (legível sobre o fundo azul da página)
        sx={{ color: (t) => `var(--fnc-apoio, ${t.palette.text.secondary})` }}
        checked={marcado}
        onChange={(e) => setMarcado(e.target.checked)}
      />
    }
  />
);

export default InputCheckBox;
