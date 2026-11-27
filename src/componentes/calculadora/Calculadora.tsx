import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Icon,
  IconButton,
  Paper,
  Portal,
  Stack,
  Typography,
} from "@mui/material";

import {
  acrescentar,
  calcular,
  OPERADORES,
  paraExpressao,
} from "./regrasCalculadora";
import { useCalculadora } from "../../hooks/useCalculadora";

// teclas na ordem da grade (4 colunas); "=" ocupa duas linhas e "0" duas colunas
const TECLAS = [
  "C",
  "⌫",
  "÷",
  "×",
  "7",
  "8",
  "9",
  "−",
  "4",
  "5",
  "6",
  "+",
  "1",
  "2",
  "3",
  "=",
  "0",
  ",",
];
const POSICAO: Record<string, object> = {
  "=": { gridRow: "span 2" },
  "0": { gridColumn: "span 2" },
};
// teclado físico -> tecla da calculadora
const TECLADO: Record<string, string> = {
  "-": "−",
  "*": "×",
  "/": "÷",
  ".": ",",
  Enter: "=",
  Backspace: "⌫",
  Delete: "C",
};

// Calculadora flutuante, aberta pelo item "Calculadora" da barra lateral; fica colada à barra, embaixo.
// Fica acima das gavetas (Modal), para usar enquanto cadastra uma movimentação, sem bloquear a tela atrás.

const Calculadora: React.FC = () => {
  const { calculadoraAberta: aberta, fecharCalculadora: onClose } =
    useCalculadora();
  const [expr, setExpr] = useState("");
  // depois do "=", digitar um número começa uma conta nova; um operador continua do resultado
  const [mostrandoResultado, setMostrandoResultado] = useState(false);
  const painel = useRef<HTMLDivElement>(null);
  // a âncora fica no início da área central: a largura da barra lateral muda (recolhida, celular)
  const ancora = useRef<HTMLSpanElement>(null);
  const [esquerda, setEsquerda] = useState(0);
  // posição escolhida arrastando o cabeçalho (null: canto inferior esquerdo da área central)
  const [posicao, setPosicao] = useState<{ x: number; y: number } | null>(null);
  const pegou = useRef<{ dx: number; dy: number } | null>(null);

  const comecarArrastar = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button") || !painel.current) return;
    const r = painel.current.getBoundingClientRect();
    pegou.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const arrastar = (e: React.PointerEvent) => {
    if (!pegou.current || !painel.current) return;
    const { width, height } = painel.current.getBoundingClientRect();
    const limitar = (v: number, max: number) => Math.max(0, Math.min(v, max));
    setPosicao({
      x: limitar(e.clientX - pegou.current.dx, window.innerWidth - width),
      y: limitar(e.clientY - pegou.current.dy, window.innerHeight - height),
    });
  };
  const soltar = () => {
    pegou.current = null;
  };

  useEffect(() => {
    if (aberta) painel.current?.focus();
  }, [aberta]);

  useEffect(() => {
    const area = ancora.current?.parentElement;
    if (!area) return;
    const observador = new ResizeObserver(() =>
      setEsquerda(area.getBoundingClientRect().left),
    );
    observador.observe(area);
    return () => observador.disconnect();
  }, []);

  const previa = calcular(expr);
  const pressionar = (tecla: string) => {
    setMostrandoResultado(tecla === "=");
    if (tecla === "C") return setExpr("");
    if (tecla === "⌫") return setExpr((e) => e.slice(0, -1));
    if (tecla === "=")
      return setExpr(previa === null ? expr : paraExpressao(previa));
    const base = mostrandoResultado && !OPERADORES.includes(tecla) ? "" : expr;
    setExpr(acrescentar(base, tecla));
  };

  const aoTeclar = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return onClose();
    const tecla = TECLADO[e.key] ?? e.key;
    if (!TECLAS.includes(tecla)) return;
    e.preventDefault(); // Enter num botão focado também clicaria nele
    pressionar(tecla);
  };

  const divisaoPorZero = previa === null && /÷0(,0*)?$/.test(expr);

  return (
    <>
      <span ref={ancora} style={{ position: "absolute" }} />
      {/* no body: dentro da área central o empilhamento ficaria abaixo das gavetas */}
      <Portal>
        {aberta && (
          <Paper
            ref={painel}
            tabIndex={-1}
            onKeyDown={aoTeclar}
            elevation={8}
            role="dialog"
            aria-label="Calculadora"
            sx={{
              position: "fixed",
              // min(): se a janela diminuir, a calculadora arrastada não fica fora da tela
              ...(posicao
                ? {
                    left: `min(${posicao.x}px, calc(100vw - 280px))`,
                    top: `min(${posicao.y}px, calc(100dvh - 120px))`,
                  }
                : { left: esquerda + 16, bottom: 16 }),
              width: 280,
              maxWidth: `calc(100vw - ${esquerda + 32}px)`,
              p: 2,
              borderRadius: "12px",
              zIndex: (t) => t.zIndex.modal + 1,
              outline: "none",
            }}
          >
            {/* cabeçalho = alça para arrastar (mouse e dedo) */}
            <Stack
              direction="row"
              onPointerDown={comecarArrastar}
              onPointerMove={arrastar}
              onPointerUp={soltar}
              onPointerCancel={soltar}
              sx={{
                alignItems: "center",
                mb: 1,
                cursor: "move",
                touchAction: "none",
                userSelect: "none",
              }}
            >
              <Icon fontSize="small" sx={{ color: "text.secondary", mr: 0.5 }}>
                drag_indicator
              </Icon>
              <Typography variant="subtitle2" sx={{ flex: 1 }}>
                Calculadora
              </Typography>
              <IconButton
                size="small"
                aria-label="Fechar calculadora"
                onClick={() => onClose()}
              >
                <Icon fontSize="small">close</Icon>
              </IconButton>
            </Stack>

            <Box
              aria-live="polite"
              sx={{
                textAlign: "right",
                mb: 1.5,
                px: 1,
                py: 1,
                borderRadius: "8px",
                bgcolor: "action.hover",
                minHeight: 72,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  wordBreak: "break-all",
                  minHeight: 20,
                }}
              >
                {mostrandoResultado ? "" : expr}
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, wordBreak: "break-all" }}
              >
                {divisaoPorZero
                  ? "Não dá para dividir por zero"
                  : previa === null
                    ? "0"
                    : paraExpressao(previa)}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 1,
              }}
            >
              {TECLAS.map((tecla) => (
                <Button
                  key={tecla}
                  onClick={() => pressionar(tecla)}
                  variant={tecla === "=" ? "contained" : "text"}
                  aria-label={
                    tecla === "⌫"
                      ? "Apagar"
                      : tecla === "C"
                        ? "Limpar"
                        : undefined
                  }
                  // teclas preenchidas: o contorno (outlined) quase sumia no modo escuro
                  sx={[
                    {
                      minWidth: 0,
                      height: 44,
                      fontSize: 18,
                      borderRadius: "8px",
                      ...POSICAO[tecla],
                    },
                    tecla !== "=" && {
                      bgcolor: "action.selected",
                      color: (t) =>
                        /[0-9,]/.test(tecla)
                          ? t.palette.text.primary
                          : t.palette.primary[
                              t.palette.mode === "dark" ? "light" : "main"
                            ],
                      "&:hover": { bgcolor: "action.focus" },
                    },
                  ]}
                >
                  {tecla}
                </Button>
              ))}
            </Box>
          </Paper>
        )}
      </Portal>
    </>
  );
};

export default Calculadora;
