/**
 * CnpjProvider
 *
 * Interface comum pra qualquer fonte de dados de CNPJ.
 * Implementações: BrasilApiProvider, ReceitaWsProvider (Strategy Pattern).
 *
 * Erros padronizados:
 *   CNPJ_NOT_FOUND — 404 do provider
 *   PROVIDER_RATE_LIMIT — provider rejeitou por rate limit (deve tentar fallback)
 *   PROVIDER_UNAVAILABLE — provider fora do ar / timeout (deve tentar fallback)
 *   INVALID_RESPONSE — provider retornou algo inesperado
 */
import type { CnpjLookupResponse } from "@radar/types";

export interface CnpjProvider {
  readonly name: "brasilapi" | "receitaws";
  fetch(cnpj: string): Promise<CnpjLookupResponse>;
}

export class CnpjNotFoundError extends Error {
  readonly code = "CNPJ_NOT_FOUND";
  constructor(cnpj: string) {
    super(`CNPJ não encontrado: ${cnpj}`);
  }
}

export class ProviderRateLimitError extends Error {
  readonly code = "PROVIDER_RATE_LIMIT";
  constructor(provider: string) {
    super(`Rate limit excedido no provider: ${provider}`);
  }
}

export class ProviderUnavailableError extends Error {
  readonly code = "PROVIDER_UNAVAILABLE";
  constructor(provider: string, cause?: unknown) {
    super(`Provider indisponível: ${provider}${cause ? ` (${String(cause)})` : ""}`);
  }
}
