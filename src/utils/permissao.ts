// Nível de acesso do usuário numa conta bancária, como vem da API.
export const PERMISSAO = {
  Mestre: 0,
  Administrador: 1,
  Visualizador: 2,
} as const;

export const nomePermissao = (permissao: number) =>
  permissao === PERMISSAO.Mestre
    ? "Mestre"
    : permissao === PERMISSAO.Administrador
      ? "Administrador"
      : "Visualizador";

// ícone (Material Icons) de cada nível de acesso
export const iconePermissao = (permissao: number) =>
  permissao === PERMISSAO.Mestre
    ? "workspace_premium"
    : permissao === PERMISSAO.Administrador
      ? "admin_panel_settings"
      : "visibility";

// opções do InputSelect de permissão (convite e edição de membro)
export const OPCOES_PERMISSAO = [
  PERMISSAO.Administrador,
  PERMISSAO.Visualizador,
  PERMISSAO.Mestre,
].map((p) => ({ rotulo: nomePermissao(p), valor: String(p) }));
