import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { tema } from "./tema";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ptBR } from "@mui/x-date-pickers/locales";
import "dayjs/locale/pt-br";

import { AuthProvider } from "./contexts/AuthContext";
import { ContaProvider } from "./contexts/ContaContext";
import { Login } from "./telas/login/Login";
import { Registrar } from "./telas/registrar/Registrar";
import { Inicial } from "./telas/inicial/Inicial";
import LayoutPrincipal, {
  ContaDaRota,
} from "./componentes/layout-principal/LayoutPrincipal";
import Movimentacoes from "./telas/movimentacoes/Movimentacoes";
import Dashboard from "./telas/dashboard/Dashboard";
import AvisoAtualizacao from "./componentes/aviso-atualizacao/AvisoAtualizacao";

function App() {
  return (
    // Router por fora: o AuthProvider usa navigate no logout.
    <ThemeProvider theme={tema}>
      {/* datas dos DatePicker em português (dd/mm/aaaa, meses e botões traduzidos) */}
      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        adapterLocale="pt-br"
        localeText={
          ptBR.components.MuiLocalizationProvider.defaultProps.localeText
        }
      >
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AuthProvider>
            <ContaProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/registrar" element={<Registrar />} />
                {/* Telas logadas: todas com a barra lateral */}
                <Route element={<LayoutPrincipal />}>
                  <Route path="/" element={<Inicial />} />
                  <Route element={<ContaDaRota />}>
                    <Route
                      path="/:idConta/contabancaria"
                      element={<Movimentacoes />}
                    />
                    <Route path="/:idConta/dashboard" element={<Dashboard />} />
                  </Route>
                </Route>
                {/* endereço antigo da tela inicial: links e favoritos salvos continuam funcionando */}
                <Route path="/inicial" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
              <AvisoAtualizacao />
            </ContaProvider>
          </AuthProvider>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
