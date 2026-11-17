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

// Chip de categoria: fundo na cor exata da API e texto branco; preto só em cores claras.
// Branco a partir de 3:1 porque, em tons saturados (laranja, verde, ciano), o preto que o WCAG
// prefere fica apagado; o chip compensa com texto em negrito (600).
// null quando a cor não é hex (o chip usa as cores padrão).
export const coresChipCategoria = (hex: string) => {
  const fundo = lerHex(hex);
  if (!fundo) return null;
  const texto = contraste(BRANCO, fundo) >= 3 ? BRANCO : PRETO;
  return {
    fundo: css(fundo),
    texto: css(texto),
    rgbFundo: fundo,
    rgbTexto: texto,
  };
};

// Cor da conta como fundo de texto branco (avatar e faixa do card): escurece até contraste 4.5:1.
// Cor que não é hex volta como veio.
export const corParaTextoBranco = (hex: string) => {
  const cor = lerHex(hex);
  if (!cor) return hex;
  let fundo = cor;
  for (let t = 0; contraste(BRANCO, fundo) < 4.5 && t < 1;) {
    t = Math.min(1, t + 0.05);
    fundo = misturar(cor, PRETO, t);
  }
  return css(fundo);
};

// Paleta fechada das categorias (sem cor personalizada): só tons escuros o bastante para o
// texto branco do chip passar de 4.5:1 (testado em scripts/testa-cor-categoria.ts).
export const CORES_CATEGORIA = [
  { nome: "Vermelho", valor: "#b91c1c" },
  { nome: "Laranja", valor: "#c2410c" },
  { nome: "Âmbar", valor: "#a16207" },
  { nome: "Verde", valor: "#15803d" },
  { nome: "Verde-azulado", valor: "#0f766e" },
  { nome: "Azul", valor: "#1d4ed8" },
  { nome: "Roxo", valor: "#6d28d9" },
  { nome: "Rosa", valor: "#be185d" },
  { nome: "Marrom", valor: "#92400e" },
  { nome: "Cinza", valor: "#475569" },
];
