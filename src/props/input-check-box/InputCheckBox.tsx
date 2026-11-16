import { Checkbox, FormControlLabel } from "@mui/material";

interface PropInputCheckBox {
  label: string;
  checked: boolean;
  setChecked: (value: boolean) => void;
}

// Mantém a API antiga para as telas não mudarem; por dentro é o Checkbox do MUI.
const InputCheckBox: React.FC<PropInputCheckBox> = ({
  label,
  checked,
  setChecked,
}) => (
  <FormControlLabel
    sx={{ width: "100%", m: 0 }}
    label={label}
    control={
      <Checkbox
        size="small"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
    }
  />
);

export default InputCheckBox;
