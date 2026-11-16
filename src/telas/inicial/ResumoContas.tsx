import {
  Box,
  Button,
  Card,
  Icon,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import type { ConteudoContas } from "../../models/contas-usuarios/GetContasBancarias";
import { exibirMoeda } from "../../utils/formatacao";
import Indicador from "../contas-bancarias/componente/indicador/Indicador";

const COR_ROTULO = "#bedbff";

const saudacao = () => {
  const hora = new Date().getHours();
  // mantido como estava: com "&&" esta condição nunca é verdadeira
  if (hora >= 22 && hora <= 3)
    return "Vá dormir! Você é corno 🐂 , não morcego... 🦇🦇";
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
};

type Props = {
  conteudo?: ConteudoContas; // sem dados ainda: mostra só o cabeçalho
  onNovaConta: () => void;
  ocultarValores: boolean;
  onAlternarOcultar: () => void;
};

// Topo da tela inicial: título "Minhas Contas", botão de nova conta e o resumo do patrimônio.
const ResumoContas: React.FC<Props> = ({
  conteudo,
  onNovaConta,
  ocultarValores,
  onAlternarOcultar,
}) => (
  <Card
    elevation={0}
    sx={{
      p: { xs: 2, sm: 2.5 },
      borderRadius: "16px",
      color: "#fff",
      bgcolor: "primary.main",
      backgroundImage: "none",
      display: "flex",
      flexDirection: "column",
      gap: 2.5,
    }}
  >
    <Stack
      direction="row"
      useFlexGap
      sx={{
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: COR_ROTULO }}>
          {saudacao()}
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Typography
            component="h1"
            sx={{ fontSize: 24, fontWeight: 800, color: "inherit" }}
          >
            Minhas Contas
          </Typography>
          <Tooltip
            title={ocultarValores ? "Mostrar valores" : "Ocultar valores"}
          >
            <IconButton
              onClick={onAlternarOcultar}
              aria-label={
                ocultarValores ? "Mostrar valores" : "Ocultar valores"
              }
              aria-pressed={ocultarValores}
              sx={{ color: COR_ROTULO }}
            >
              <Icon>{ocultarValores ? "visibility_off" : "visibility"}</Icon>
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* branco: o botão padrão (degradê azul) sumiria sobre o fundo do card */}
      <Button
        variant="contained"
        startIcon={<Icon>add</Icon>}
        onClick={onNovaConta}
        sx={{
          px: 2.5,
          background: "#fff",
          color: "primary.main",
          boxShadow: "none",
          "&:hover": { background: "#eef2ff", boxShadow: "none" },
        }}
      >
        Nova conta bancária
      </Button>
    </Stack>

    {conteudo && (
      <Stack
        direction="row"
        useFlexGap
        sx={{
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 2,
          pt: 2,
          borderTop: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <Stack
          direction="row"
          spacing={4}
          useFlexGap
          sx={{ flexWrap: "wrap", alignItems: "flex-end" }}
        >
          <Box>
            <Stack
              direction="row"
              spacing={0.75}
              sx={{ alignItems: "center", color: COR_ROTULO }}
            >
              <Icon sx={{ fontSize: 16 }}>account_balance</Icon>
              <Typography
                sx={{ fontSize: 13, fontWeight: 500, color: "inherit" }}
              >
                Patrimônio total
              </Typography>
            </Stack>
            <Typography
              sx={{
                fontSize: 28,
                fontWeight: 800,
                lineHeight: 1.2,
                color: "inherit",
              }}
            >
              {exibirMoeda(conteudo.saldoRealizado, ocultarValores)}
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{ fontSize: 13, fontWeight: 500, color: COR_ROTULO }}
            >
              Projetado
            </Typography>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 700,
                lineHeight: 1.3,
                color: "inherit",
              }}
            >
              {exibirMoeda(conteudo.saldoProjetado, ocultarValores)}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={3} useFlexGap sx={{ flexWrap: "wrap" }}>
          <Indicador
            icone="arrow_upward"
            rotulo="Receitas"
            valor={conteudo.entradaPendente}
            oculto={ocultarValores}
          />
          <Indicador
            icone="arrow_downward"
            rotulo="Despesas"
            valor={conteudo.saidaPendente}
            oculto={ocultarValores}
          />
        </Stack>
      </Stack>
    )}
  </Card>
);

export default ResumoContas;
