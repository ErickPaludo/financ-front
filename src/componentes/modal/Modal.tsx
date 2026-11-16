import React from "react";
import {
  Box,
  Drawer,
  Icon,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import { tema as temaEscuro } from "../../tema";
import {
  BarraLateralClara,
  CoresClaro,
  CoresEscuro,
  variaveisTelas,
} from "../../cores";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  titulo?: string;
  children: React.ReactNode;
};

// Gaveta da direita (padrão dos formulários), nas mesmas cores da barra lateral:
// branca com o tema claro no modo claro, escura no escuro. O conteúdo só existe com a gaveta aberta.
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, titulo, children }) => {
  const temaAtual = useTheme();
  const claro = temaAtual.palette.mode === "light";
  const barra = claro ? BarraLateralClara : CoresEscuro.barraLateral;

  return (
    <ThemeProvider theme={claro ? temaAtual : temaEscuro}>
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={onClose}
        slotProps={{
          paper: {
            // a gaveta fica fora da área central: componentes antigos dentro dela leem as variáveis daqui
            style: variaveisTelas(claro ? CoresClaro : CoresEscuro),
            sx: {
              width: { xs: "100%", sm: 450 },
              bgcolor: barra.fundo,
              backgroundImage: "none",
              borderLeft: `1px solid ${barra.contorno}`,
              color: barra.titulo,
            },
          },
        }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: titulo ? "space-between" : "flex-end",
            px: 3,
            pt: 2,
          }}
        >
          {titulo && (
            <Typography component="h2" sx={{ fontSize: 20, fontWeight: 800 }}>
              {titulo}
            </Typography>
          )}
          <IconButton onClick={onClose} aria-label="Fechar">
            <Icon>close</Icon>
          </IconButton>
        </Stack>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            px: 3,
            pt: 1,
            pb: 3,
          }}
        >
          {children}
        </Box>
      </Drawer>
    </ThemeProvider>
  );
};

export default Modal;
