import { useContext, type ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import BotaoOcultarValores from "../../componentes/botao-ocultar-valores/BotaoOcultarValores";

import type { ConteudoContas } from "../../models/contas-usuarios/GetContasBancarias";
import { AuthContext } from "../../contexts/AuthContext";
import { exibirMoeda } from "../../utils/formatacao";
import TituloPagina from "../../componentes/titulo-pagina/TituloPagina";

const saudacao = () => {
  const hora = new Date().getHours();
  // mantido como estava: com "&&" esta condição nunca é verdadeira
  if (hora >= 22 && hora <= 3)
    return "Vá dormir! Você é corno 🐂 , não morcego... 🦇🦇";
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
};

type PropResumoContas = {
  conteudo?: ConteudoContas; // sem dados ainda: mostra só o cabeçalho
  onNovaConta: () => void;
  ocultarValores: boolean;
  onAlternarOcultar: () => void;
};

const rotulo = { fontSize: 13, fontWeight: 500, color: "var(--fnc-tx-apoio)" };
const numero = {
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
  fontVariantNumeric: "tabular-nums",
  mt: 0.5,
};

// Coluna do card de resumo. As divisórias são sombras de 1px à direita e embaixo:
// o card corta as da borda, então ficam certas com 4, 2 ou 1 coluna por linha.
const Coluna: React.FC<{ children: ReactNode }> = ({ children }) => (
  <Box
    sx={{
      p: "22px 24px",
      boxShadow:
        "1px 0 0 0 var(--fnc-tx-divisoria), 0 1px 0 0 var(--fnc-tx-divisoria)",
    }}
  >
    {children}
  </Box>
);

// Topo da tela inicial: saudação, "Minhas contas", botões e o card de resumo do patrimônio.
const ResumoContas: React.FC<PropResumoContas> = ({
  conteudo,
  ocultarValores,
  onAlternarOcultar,
}) => {
  const { user } = useContext(AuthContext);
  const contas = conteudo?.contas ?? [];
  const noTotal = contas.filter((c) => c.somaSaldo).length;

  return (
    <Stack spacing={3}>
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
          <Typography sx={{ fontSize: 13, color: "var(--fnc-tx-apoio)" }}>
            {saudacao()}
            {user?.primeiroNome && `, ${user.primeiroNome}`}
          </Typography>
          <TituloPagina titulo="Minhas contas" />
        </Box>

        <Stack direction="row" spacing={1.5}>
          <BotaoOcultarValores
            ocultos={ocultarValores}
            onAlternar={onAlternarOcultar}
          />
        </Stack>
      </Stack>

      {conteudo && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            bgcolor: "var(--fnc-tx-superficie)",
            border: "1px solid var(--fnc-tx-borda)",
            borderRadius: "16px",
            overflow: "hidden", // corta as divisórias que caem na borda
          }}
        >
          <Coluna>
            <Typography sx={rotulo}>Patrimônio total</Typography>
            <Typography
              sx={{ ...numero, fontSize: 30, color: "var(--fnc-tx-texto)" }}
            >
              {exibirMoeda(conteudo.saldoRealizado, ocultarValores)}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "var(--fnc-tx-apoio)", mt: 0.5 }}>
              {noTotal} de {contas.length} contas no total
            </Typography>
          </Coluna>

          <Coluna>
            <Typography sx={rotulo}>Projetado</Typography>
            <Typography
              sx={{
                ...numero,
                fontSize: 30,
                color:
                  conteudo.saldoProjetado < 0 && !ocultarValores
                    ? "var(--fnc-tx-despesa)"
                    : "var(--fnc-tx-texto)",
              }}
            >
              {exibirMoeda(conteudo.saldoProjetado, ocultarValores)}
            </Typography>
          </Coluna>

          <Coluna>
            <Typography sx={rotulo}>↑ Receitas pendentes</Typography>
            <Typography
              sx={{ ...numero, fontSize: 24, color: "var(--fnc-tx-receita)" }}
            >
              {exibirMoeda(conteudo.entradaPendente, ocultarValores)}
            </Typography>
          </Coluna>

          <Coluna>
            <Typography sx={rotulo}>↓ Despesas pendentes</Typography>
            <Typography
              sx={{ ...numero, fontSize: 24, color: "var(--fnc-tx-despesa)" }}
            >
              {exibirMoeda(conteudo.saidaPendente, ocultarValores)}
            </Typography>
          </Coluna>
        </Box>
      )}
    </Stack>
  );
};

export default ResumoContas;
