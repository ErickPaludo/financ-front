import { Alert, Button, Snackbar } from "@mui/material";
import { useRegisterSW } from "virtual:pwa-register/react";

// Aviso do PWA: app pronto para uso offline ou nova versão disponível (recarregar).
function AvisoAtualizacao() {
  const {
    offlineReady: [prontoOffline, setProntoOffline],
    needRefresh: [temAtualizacao, setTemAtualizacao],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(erro) {
      console.error("Erro ao registrar o service worker", erro);
    },
  });

  const fechar = () => {
    setProntoOffline(false);
    setTemAtualizacao(false);
  };

  return (
    <Snackbar
      open={prontoOffline || temAtualizacao}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        severity="info"
        onClose={fechar}
        action={
          <>
            {temAtualizacao && (
              <Button
                color="inherit"
                size="small"
                onClick={() => updateServiceWorker(true)}
              >
                Recarregar
              </Button>
            )}
            <Button color="inherit" size="small" onClick={fechar}>
              Fechar
            </Button>
          </>
        }
      >
        {prontoOffline
          ? "App pronto para funcionar offline"
          : "Novo conteúdo disponível, clique em recarregar para atualizar."}
      </Alert>
    </Snackbar>
  );
}

export default AvisoAtualizacao;
