import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

interface PropMsgBox {
  titulo: string;
  descricao?: string;
  // "pergunta": Sim/Não; "aviso": só Ok
  tipo: "pergunta" | "aviso";
  centralizar?: boolean;
  aoResponder?: (sim: boolean) => void;
}

// Aviso (Ok) ou pergunta (Sim/Não). Fechar sem responder conta como "Não".
const MsgBox: React.FC<PropMsgBox> = ({
  titulo,
  descricao,
  tipo,
  centralizar = false,
  aoResponder,
}) => {
  const [aberto, setAberto] = useState(true);

  const responder = (sim: boolean) => {
    aoResponder?.(sim);
    setAberto(false);
  };

  return (
    <Dialog
      open={aberto}
      onClose={() => responder(false)}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ fontWeight: 700 }}>{titulo}</DialogTitle>
      {descricao && (
        <DialogContent>
          <DialogContentText
            sx={{ textAlign: centralizar ? "center" : "left" }}
          >
            {descricao}
          </DialogContentText>
        </DialogContent>
      )}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {tipo === "pergunta" ? (
          <>
            <Button color="inherit" onClick={() => responder(false)}>
              Não
            </Button>
            <Button variant="contained" onClick={() => responder(true)}>
              Sim
            </Button>
          </>
        ) : (
          <Button variant="contained" onClick={() => responder(true)}>
            Ok
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MsgBox;
