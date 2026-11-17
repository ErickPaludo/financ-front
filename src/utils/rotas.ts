// Telas de uma conta bancária (/:idConta/contabancaria e /:idConta/dashboard): mostram a conta
// atual e os subtópicos dela na barra lateral, com o tema claro e o fundo desfocado.
export const ehTelaDaConta = (rota: string) =>
  /\/(contabancaria|dashboard)$/.test(rota);
