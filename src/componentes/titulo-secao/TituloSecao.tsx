import type { ElementType, ReactNode } from "react";
import { ListSubheader } from "@mui/material";

type PropTituloSecao = {
  children: ReactNode;
  cor?: string; // padrão: cor de apoio do tema
  component?: ElementType; // "li" quando é o subheader de uma <List>
  semRecuo?: boolean; // alinhado com os campos de um formulário
};

// Título de seção em caixa alta: seções do menu da barra, tópicos dos painéis e partes de formulário.
const TituloSecao: React.FC<PropTituloSecao> = ({
  children,
  cor = "text.secondary",
  component = "div",
  semRecuo = false,
}) => (
  <ListSubheader
    component={component}
    disableSticky
    disableGutters={semRecuo}
    sx={{
      bgcolor: "transparent",
      color: cor,
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: 1,
      textTransform: "uppercase",
      lineHeight: "32px",
    }}
  >
    {children}
  </ListSubheader>
);

export default TituloSecao;
