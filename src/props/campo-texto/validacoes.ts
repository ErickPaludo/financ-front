// Validações dos campos de formulário. Cada validador devolve a mensagem de erro, ou null se o valor for válido.

export const MENSAGEM_CAMPOS_VAZIOS = "Preencha todos os campos";

// Formato básico nome@dominio.ext; a validação definitiva é do backend.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validarEmail = (email: string) =>
  EMAIL_REGEX.test(email.trim()) ? null : "Informe um email válido";

// Cria o validador do campo "confirmar senha" comparando com a senha digitada.
export const validarConfirmacaoSenha =
  (senha: string) => (confirmacao: string) =>
    confirmacao === senha ? null : "As senhas não coincidem";

export const existeCampoVazio = (...valores: string[]) =>
  valores.some((valor) => !valor.trim());
