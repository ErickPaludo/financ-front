import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { tema } from "./tema";

import { AuthProvider } from "./contexts/AuthContext";
import { ContaProvider } from "./contexts/ContaContext";
import { ConviteProvider } from "./contexts/ConviteContext";
import { MovimentacaoProvider } from "./contexts/MovimentacaoContext";
import { Login } from "./telas/login/Login";
import { Registrar } from "./telas/registrar/Registrar";
import { Home } from "./telas/home/Home";
import ReloadPrompt from "./componentes/reload-prompt/ReloadPrompt";

function App() {
  return (
    // Router por fora: o AuthProvider usa navigate no logout.
    <ThemeProvider theme={tema}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <ContaProvider>
            <MovimentacaoProvider>
              <ConviteProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/registrar" element={<Registrar />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
                <ReloadPrompt />
              </ConviteProvider>
            </MovimentacaoProvider>
          </ContaProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
