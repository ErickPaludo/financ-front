import { useTheme } from "@mui/material";

import { coresDaBarra } from "../cores";

// Cores da barra lateral no modo do tema atual (barra, painéis laterais).
export const useCoresBarra = () =>
  coresDaBarra(useTheme().palette.mode === "light");
