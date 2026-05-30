/**
 * lib/error-messages.ts
 *
 * Catálogo central de mensagens amigáveis em PT-BR.
 * Mapeia error codes (vindos do backend ou gerados no client) pra strings legíveis.
 *
 * Convenção:
 *  - Códigos vêm do backend no formato SCREAMING_SNAKE_CASE
 *  - Códigos client-only (NETWORK_ERROR, TIMEOUT, CANCELLED) cobrem casos que não chegam à API
 *  - Mensagens curtas, acionáveis e em segunda pessoa
 *
 * Pra adicionar um novo code:
 *  1. Use o mesmo nome do code que o backend retorna
 *  2. Adicione a mensagem aqui
 *  3. Consumidores nem precisam ser tocados
 */

import { ApiClientError } from "./api";

export const MESSAGES: Record<string, string> = {
  // ===== Auth =====
  INVALID_CREDENTIALS: "Email ou senha incorretos.",
  INVALID_CURRENT_PASSWORD: "A senha atual está incorreta.",
  UNAUTHORIZED: "Faça login novamente.",
  SESSION_INVALID: "Sessão expirada. Faça login novamente.",
  USER_DISABLED: "Esta conta está desativada. Fale com o suporte.",

  // ===== Cadastro =====
  EMAIL_ALREADY_EXISTS: "Este email já está cadastrado.",
  CPF_ALREADY_EXISTS: "Este CPF já está cadastrado.",
  CNPJ_ALREADY_EXISTS: "Este CNPJ já está cadastrado em outra loja.",
  INVALID_CPF: "CPF inválido. Confira os dígitos.",
  INVALID_CNPJ: "CNPJ inválido. Confira os dígitos.",
  CNPJ_LOOKUP_FAILED: "Não conseguimos consultar este CNPJ agora. Tente novamente em instantes.",
  CNPJ_NOT_FOUND: "CNPJ não encontrado na Receita Federal.",
  CNPJ_INACTIVE: "Este CNPJ está com situação cadastral irregular.",
  WEAK_PASSWORD: "A senha precisa ter no mínimo 8 caracteres.",

  // ===== Verificação OTP =====
  VERIFICATION_INVALID_CODE: "Código incorreto ou expirado.",
  VERIFICATION_TOO_MANY_ATTEMPTS: "Muitas tentativas incorretas. Peça um novo código.",
  VERIFICATION_COOLDOWN: "Aguarde alguns segundos antes de pedir um novo código.",
  VERIFICATION_TOKEN_INVALID: "Verificação expirada. Reinicie o processo.",
  VERIFICATION_NOT_FOUND: "Código não encontrado. Peça um novo.",

  // ===== Loja =====
  STORE_NOT_FOUND: "Loja não encontrada.",
  STORE_ACCESS_DENIED: "Apenas o lojista pode gerenciar a loja.",

  // ===== Genéricos do backend =====
  FORBIDDEN: "Você não tem permissão pra essa ação.",
  NOT_FOUND: "Não encontramos o que você procurava.",
  CONFLICT: "Este recurso já existe ou está em uso.",
  VALIDATION_FAILED: "Verifique os dados informados.",
  RATE_LIMITED: "Muitas tentativas. Aguarde um momento.",
  INTERNAL_ERROR: "Algo deu errado do nosso lado. Tente novamente em instantes.",
  SERVICE_UNAVAILABLE: "Serviço indisponível no momento. Tente em instantes.",
  UNPROCESSABLE_ENTITY: "Não foi possível processar essa requisição.",
  UNKNOWN_ERROR: "Algo deu errado. Tente novamente.",

  // ===== Client-only =====
  NETWORK_ERROR: "Sem conexão. Verifique sua internet.",
  TIMEOUT: "A requisição demorou demais. Tente novamente.",
  CANCELLED: "Operação cancelada.",

  // Fallback final
  UNKNOWN: "Algo deu errado. Tente novamente.",
};

/**
 * Resolve qualquer erro numa mensagem amigável.
 * Precedência: mapa local → mensagem do servidor → fallback.
 */
export function toFriendlyError(err: unknown): string {
  if (err instanceof ApiClientError) {
    return MESSAGES[err.code] ?? err.message ?? MESSAGES.UNKNOWN;
  }
  if (err instanceof TypeError && err.message.includes("fetch")) {
    return MESSAGES.NETWORK_ERROR;
  }
  if (err instanceof DOMException && err.name === "AbortError") {
    return MESSAGES.CANCELLED;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return MESSAGES.UNKNOWN;
}

/**
 * Variante que retorna code + message — usar quando precisar
 * ramificar lógica (ex.: detectar 401 pra redirecionar).
 */
export function resolveError(err: unknown): { code: string; message: string } {
  if (err instanceof ApiClientError) {
    return {
      code: err.code,
      message: MESSAGES[err.code] ?? err.message ?? MESSAGES.UNKNOWN,
    };
  }
  if (err instanceof TypeError && err.message.includes("fetch")) {
    return { code: "NETWORK_ERROR", message: MESSAGES.NETWORK_ERROR };
  }
  if (err instanceof DOMException && err.name === "AbortError") {
    return { code: "CANCELLED", message: MESSAGES.CANCELLED };
  }
  return { code: "UNKNOWN", message: MESSAGES.UNKNOWN };
}
