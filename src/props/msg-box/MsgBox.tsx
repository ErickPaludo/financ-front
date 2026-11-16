import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { TypeMsgBox } from "./TypeMsgBox";

interface PropMsgBox {
  title: string;
  description?: string;
  type: TypeMsgBox;
  centerlize?: boolean;
  onQuestion?: (value: boolean) => void;
}

// Aviso (Ok) ou pergunta (Sim/Não). Fechar sem responder conta como "Não".
const MsgBox: React.FC<PropMsgBox> = ({
  title,
  description,
  type,
  centerlize = false,
  onQuestion,
}) => {
  const [aberto, setAberto] = useState(true);

  const responder = (valor: boolean) => {
    onQuestion?.(valor);
    setAberto(false);
  };

  return (
    <Dialog
      open={aberto}
      onClose={() => responder(false)}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      {description && (
        <DialogContent>
          <DialogContentText sx={{ textAlign: centerlize ? "center" : "left" }}>
            {description}
          </DialogContentText>
        </DialogContent>
      )}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {type === TypeMsgBox.Question ? (
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
