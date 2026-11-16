const moedaBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const formatarMoeda = (valor: number) => moedaBRL.format(valor);

// Valor em R$ para exibir na tela; com os valores ocultos (botão de olho) mostra só a máscara.
export const exibirMoeda = (valor: number, oculto: boolean) =>
  oculto ? "R$ ••••" : formatarMoeda(valor);

// Data e hora local no formato do <input type="datetime-local">, usado pelos filtros (dayjs.format).
export const FORMATO_DATA_HORA = "YYYY-MM-DDTHH:mm";

// Sinal além da cor (acessibilidade): "+R$ 105,00" / "−R$ 145,00" (sinal de menos tipográfico).
export const valorComSinal = (valor: number) =>
  `${valor < 0 ? "−" : "+"}${formatarMoeda(Math.abs(valor))}`;
