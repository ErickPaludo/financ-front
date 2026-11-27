// Regras da calculadora: a expressão é texto como "12,5+3×2" (vírgula decimal, sinais tipográficos).
export const OPERADORES = ["+", "−", "×", "÷"];
const SEPARA_OPERADORES = /[+−×÷]/;
const ehOperador = (c: string) => OPERADORES.includes(c);

// Acrescenta uma tecla (dígito, "," ou operador): operador logo após outro troca o anterior; uma vírgula por número.
export function acrescentar(expr: string, tecla: string): string {
  const ultimo = expr.slice(-1);
  if (ehOperador(tecla)) {
    if (expr === "" || expr === "−") return tecla === "−" ? "−" : expr;
    return ehOperador(ultimo) ? expr.slice(0, -1) + tecla : expr + tecla;
  }
  if (tecla === ",") {
    const numero = expr.split(SEPARA_OPERADORES).pop() ?? "";
    if (numero.includes(",")) return expr;
    return expr + (numero === "" ? "0," : ",");
  }
  return expr + tecla;
}

// Resultado da expressão (× e ÷ antes de + e −); operador no fim é ignorado. null: vazia ou divisão por zero.
export function calcular(expr: string): number | null {
  let e = expr.startsWith("−") ? "0" + expr : expr;
  if (ehOperador(e.slice(-1))) e = e.slice(0, -1);
  if (e === "") return null;
  const numeros = e.split(SEPARA_OPERADORES).map((n) => Number(n.replace(",", ".")));
  const operadores = e.match(/[+−×÷]/g) ?? [];

  const termos = [numeros[0]];
  const sinais: string[] = [];
  operadores.forEach((op, i) => {
    const n = numeros[i + 1];
    if (op === "×") termos[termos.length - 1] *= n;
    else if (op === "÷") termos[termos.length - 1] /= n;
    else {
      termos.push(n);
      sinais.push(op);
    }
  });
  const total = sinais.reduce(
    (soma, s, i) => (s === "+" ? soma + termos[i + 1] : soma - termos[i + 1]),
    termos[0],
  );
  if (!Number.isFinite(total)) return null;
  // 12 algarismos tiram o resto do ponto flutuante (0,1+0,2 = 0,3)
  return Number(total.toPrecision(12)) || 0;
}

// Número no formato da expressão: vírgula decimal, "−" e sem separador de milhar nem notação científica.
export const paraExpressao = (n: number) =>
  n
    .toLocaleString("pt-BR", { useGrouping: false, maximumFractionDigits: 10 })
    .replace("-", "−");
