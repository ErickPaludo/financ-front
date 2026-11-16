const moedaBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const formatarMoeda = (valor: number) => moedaBRL.format(valor);

// Valor em R$ para exibir na tela; com os valores ocultos (botão de olho) mostra só a máscara.
export const exibirMoeda = (valor: number, oculto: boolean) =>
  oculto ? "R$ ••••••" : formatarMoeda(valor);
