// Preferências do usuário (tudo do localStorage menos a sessão) guardadas por e-mail no logout e
// devolvidas no login seguinte (pedido do usuário): deslogar não perde mais tema, ordens, filtros.
const PREFIXO = "preferencias:";
// fora do pacote: a sessão (`user`) não pode voltar no login de outro, e a versão vista já sobrevive
const FORA = (chave: string) =>
  chave === "user" || chave === "versaoVista" || chave.startsWith(PREFIXO);

const chaveDe = (email: string) => PREFIXO + email.trim().toLowerCase();

// Logout: junta as preferências na chave do e-mail e limpa o resto (como o antigo clear()).
export function guardarPreferencias(email: string | undefined) {
  try {
    const pacote: Record<string, string> = {};
    for (const chave of Object.keys(localStorage)) {
      if (FORA(chave)) continue;
      pacote[chave] = localStorage.getItem(chave) ?? "";
      localStorage.removeItem(chave);
    }
    localStorage.removeItem("user");
    if (email && Object.keys(pacote).length)
      localStorage.setItem(chaveDe(email), JSON.stringify(pacote));
  } catch {
    // storage bloqueado: nada salvo para guardar ou limpar
  }
}

// Login: antes de abrir as telas, que leem as preferências ao montar.
export function restaurarPreferencias(email: string) {
  try {
    const salvo = localStorage.getItem(chaveDe(email));
    if (!salvo) return;
    const pacote: unknown = JSON.parse(salvo);
    if (pacote && typeof pacote === "object")
      for (const [chave, valor] of Object.entries(pacote))
        if (typeof valor === "string" && !FORA(chave))
          localStorage.setItem(chave, valor);
    localStorage.removeItem(chaveDe(email));
  } catch {
    // pacote corrompido ou storage bloqueado: entra com as preferências padrão
  }
}
