type Rgb = [number, number, number];

const BRANCO: Rgb = [255, 255, 255];
const PRETO: Rgb = [0, 0, 0];

const lerHex = (hex: string): Rgb | null => {
  let h = hex.trim().replace("#", "");
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h)) return null;
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const misturar = (a: Rgb, b: Rgb, t: number) =>
  a.map((v, i) => Math.round(v + (b[i] - v) * t)) as Rgb;

const luminancia = (c: Rgb) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// razão de contraste do WCAG (1 a 21)
export const contraste = (a: Rgb, b: Rgb) => {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
};

const css = (c: Rgb) => `rgb(${c.join(", ")})`;

// Chip de categoria: fundo suave e texto escurecido na cor da categoria até ter contraste 4.5:1.
// null quando a cor não é hex (quem chama usa as cores padrão do chip).
export const coresChipCategoria = (hex: string) => {
  const cor = lerHex(hex);
  if (!cor) return null;
  const fundo = misturar(cor, BRANCO, 0.82);
  let texto = cor;
  for (let t = 0; contraste(texto, fundo) < 4.5 && t < 1; ) {
    t = Math.min(1, t + 0.05);
    texto = misturar(cor, PRETO, t);
  }
  return { fundo: css(fundo), texto: css(texto), rgbFundo: fundo, rgbTexto: texto };
};

// Cor da conta como fundo de texto branco (avatar e faixa do card): escurece até contraste 4.5:1.
// Cor que não é hex volta como veio.
export const corParaTextoBranco = (hex: string) => {
  const cor = lerHex(hex);
  if (!cor) return hex;
  let fundo = cor;
  for (let t = 0; contraste(BRANCO, fundo) < 4.5 && t < 1; ) {
    t = Math.min(1, t + 0.05);
    fundo = misturar(cor, PRETO, t);
  }
  return css(fundo);
};
