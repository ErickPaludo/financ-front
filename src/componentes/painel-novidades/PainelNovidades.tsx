import { Box, Icon, List, ListItem, Stack, Typography } from "@mui/material";

import { useCoresBarra } from "../../hooks/useCoresBarra";
import { CabecalhoPainel } from "../painel-lateral/PainelLateral";
import TituloSecao from "../titulo-secao/TituloSecao";
import { NOVIDADES } from "./novidades";

// Conteúdo do painel "Novidades" da barra lateral: o que mudou em cada versão.
const PainelNovidades: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const barra = useCoresBarra();

  return (
    <>
      <CabecalhoPainel
        avatar={<Icon>new_releases</Icon>}
        titulo="Novidades"
        subtitulo={`Versão atual: v${__APP_VERSION__}`}
        onClose={onClose}
      />

      <Box sx={{ flex: 1, overflowY: "auto", px: 1, py: 1.5 }}>
        {NOVIDADES.map((novidade) => (
          <Box component="section" key={novidade.versao} sx={{ mb: 2 }}>
            <Typography
              component="h3"
              sx={{ px: 2, fontSize: 15, fontWeight: 700 }}
            >
              v{novidade.versao}
            </Typography>
            <Typography sx={{ px: 2, fontSize: 12, color: barra.apoio }}>
              {novidade.data}
            </Typography>

            {novidade.grupos.map((grupo) => (
              <List
                key={grupo.titulo}
                dense
                subheader={
                  <TituloSecao component="li" cor={barra.apoio}>
                    {grupo.titulo}
                  </TituloSecao>
                }
              >
                {grupo.itens.map((item) => (
                  <ListItem key={item} sx={{ alignItems: "flex-start" }}>
                    <Stack direction="row" sx={{ gap: 1 }}>
                      <Icon
                        aria-hidden
                        sx={{ fontSize: 16, mt: "2px", color: barra.item }}
                      >
                        {grupo.icone}
                      </Icon>
                      <Typography sx={{ fontSize: 13 }}>{item}</Typography>
                    </Stack>
                  </ListItem>
                ))}
              </List>
            ))}
          </Box>
        ))}
      </Box>
    </>
  );
};

export default PainelNovidades;
