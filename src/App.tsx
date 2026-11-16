import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { tema } from "./tema";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ptBR } from "@mui/x-date-pickers/locales";
import "dayjs/locale/pt-br";

import { AuthProvider } from "./contexts/AuthContext";
import { ContaProvider } from "./contexts/ContaContext";
import { ConviteProvider } from "./contexts/ConviteContext";
import { MovimentacaoProvider } from "./contexts/MovimentacaoContext";
import { Login } from "./telas/login/Login";
import { Registrar } from "./telas/registrar/Registrar";
import { Inicial } from "./telas/inicial/Inicial";
import LayoutPrincipal, {
  ContaDaRota,
  ExigeConta,
} from "./componentes/layout-principal/LayoutPrincipal";
import Movimentacoes from "./telas/movimentacoes/Movimentacoes";
import MovimentacaoFixa from "./telas/movimentacoes/fixas/MovimentacaoFixa";
import Membros from "./telas/membros/Membros";
import Convites from "./telas/convites/Convites";
import OpcoesUsuario from "./telas/usuario/OpcoesUsuario";
import ReloadPrompt from "./componentes/reload-prompt/ReloadPrompt";

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
            <MovimentacaoProvider>
              <ConviteProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/registrar" element={<Registrar />} />
                  {/* Telas logadas: todas com a barra lateral */}
                  <Route element={<LayoutPrincipal />}>
                    <Route path="/inicial" element={<Inicial />} />
                    <Route path="/convites" element={<Convites />} />
                    <Route path="/usuario" element={<OpcoesUsuario />} />
                    <Route element={<ContaDaRota />}>
                      <Route
                        path="/:idConta/contabancaria"
                        element={<Movimentacoes />}
                      />
                    </Route>
                    <Route element={<ExigeConta />}>
                      <Route path="/agendadas" element={<MovimentacaoFixa />} />
                      <Route path="/membros" element={<Membros />} />
                    </Route>
                  </Route>
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
                <ReloadPrompt />
              </ConviteProvider>
            </MovimentacaoProvider>
          </ContaProvider>
        </AuthProvider>
      </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
