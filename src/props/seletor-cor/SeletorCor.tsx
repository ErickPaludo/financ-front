import { useId, useRef } from "react";
import {
  Box,
  ButtonBase,
  FormLabel,
  Icon,
  Stack,
  Tooltip,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";

type CorPronta = { nome: string; valor: string };

// Cores sugeridas para contas (tons fortes, que funcionam com texto branco ou escuro).
const CORES_PADRAO: CorPronta[] = [
  { nome: "Azul", valor: "#155dfc" },
  { nome: "Índigo", valor: "#4f39f6" },
  { nome: "Roxo", valor: "#7f22fe" },
  { nome: "Rosa", valor: "#e60076" },
  { nome: "Vermelho", valor: "#e7000b" },
  { nome: "Laranja", valor: "#f54900" },
  { nome: "Âmbar", valor: "#e17100" },
  { nome: "Verde", valor: "#00a63e" },
  { nome: "Esmeralda", valor: "#009966" },
  { nome: "Ciano", valor: "#0092b8" },
  { nome: "Ardósia", valor: "#314158" },
  { nome: "Grafite", valor: "#18181b" },
];

const TAMANHO = 32;

type PropSeletorCor = {
  valor: string; // hex, ex. "#155dfc"
  setValor: (cor: string) => void;
  rotulo?: string;
  cores?: CorPronta[];
};

// Escolha de cor: cores prontas em círculos + uma cor personalizada (seletor nativo do navegador).
const SeletorCor: React.FC<PropSeletorCor> = ({
  valor,
  setValor,
  rotulo = "Cor",
  cores = CORES_PADRAO,
}) => {
  const idRotulo = useId();
  const refPersonalizada = useRef<HTMLInputElement>(null);
  const corAtual = valor.toLowerCase();
  const ehPersonalizada = !cores.some(
    (c) => c.valor.toLowerCase() === corAtual,
  );

  const circulo = (selecionado: boolean, fundo: string) => ({
    width: TAMANHO,
    height: TAMANHO,
    borderRadius: "50%",
    bgcolor: fundo,
    color: (t: Theme) => t.palette.getContrastText(fundo),
    // anel em volta da cor escolhida, separado por um respiro na cor do fundo
    boxShadow: selecionado
      ? (t: Theme) =>
          `0 0 0 2px ${t.palette.background.paper}, 0 0 0 4px ${t.palette.text.primary}`
      : "inset 0 0 0 1px rgba(255, 255, 255, 0.15)",
    transition: "transform 0.15s ease",
    "&:hover": { transform: "scale(1.1)" },
    "&.Mui-focusVisible": { outline: "2px solid", outlineOffset: 3 },
  });

  return (
    <Box>
      <FormLabel id={idRotulo} sx={{ display: "block", mb: 1 }}>
        {rotulo}
      </FormLabel>

      <Stack
        role="radiogroup"
        aria-labelledby={idRotulo}
        direction="row"
        useFlexGap
        sx={{ flexWrap: "wrap", gap: 1.25 }}
      >
        {cores.map(({ nome, valor: cor }) => {
          const selecionado = cor.toLowerCase() === corAtual;
          return (
            <Tooltip key={cor} title={nome}>
              <ButtonBase
                role="radio"
                aria-checked={selecionado}
                aria-label={nome}
                onClick={() => setValor(cor)}
                sx={circulo(selecionado, cor)}
              >
                {selecionado && <Icon sx={{ fontSize: 18 }}>check</Icon>}
              </ButtonBase>
            </Tooltip>
          );
        })}

        <Tooltip title="Cor personalizada">
          <ButtonBase
            role="radio"
            aria-checked={ehPersonalizada}
            aria-label="Cor personalizada"
            onClick={() => refPersonalizada.current?.click()}
            sx={{
              ...circulo(
                ehPersonalizada,
                ehPersonalizada ? valor : "transparent",
              ),
              ...(!ehPersonalizada && {
                // arco-íris indica "qualquer cor"
                background:
                  "conic-gradient(#e7000b, #f54900, #e17100, #00a63e, #0092b8, #155dfc, #7f22fe, #e60076, #e7000b)",
                color: "#fff",
              }),
            }}
          >
            <Icon sx={{ fontSize: 18 }}>
              {ehPersonalizada ? "check" : "colorize"}
            </Icon>
          </ButtonBase>
        </Tooltip>

        {/* seletor nativo, escondido: aberto pelo círculo "Cor personalizada" */}
        <Box
          component="input"
          ref={refPersonalizada}
          type="color"
          value={valor}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setValor(e.target.value)
          }
          tabIndex={-1}
          aria-hidden
          sx={{
            position: "absolute",
            width: 0,
            height: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        />
      </Stack>
    </Box>
  );
};

export default SeletorCor;
