import { Icon, IconButton, Tooltip } from "@mui/material";

import { estiloBotaoSecundario } from "../../estilos";

type PropBotaoOcultarValores = {
  ocultos: boolean;
  onAlternar: () => void;
};

// Botão de olho que esconde/mostra os valores em R$ (estado em useValoresOcultos).
const BotaoOcultarValores: React.FC<PropBotaoOcultarValores> = ({
  ocultos,
  onAlternar,
}) => {
  const texto = ocultos ? "Mostrar valores" : "Ocultar valores";
  return (
    <Tooltip title={texto}>
      <IconButton
        onClick={onAlternar}
        aria-label={texto}
        aria-pressed={ocultos}
        sx={{ ...estiloBotaoSecundario, width: 44 }}
      >
        <Icon>{ocultos ? "visibility_off" : "visibility"}</Icon>
      </IconButton>
    </Tooltip>
  );
};

export default BotaoOcultarValores;
