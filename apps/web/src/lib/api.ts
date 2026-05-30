/**
 * lib/api.ts
 *
 * Cliente HTTP minimalista pra falar com a @radar/api.
 * Single source pra fetch — facilita adicionar token, headers, error handling.
 *
 * Token de sessão fica em sessionStorage (será migrado pra cookie httpOnly).
 *
 * Tratamento de erros:
 *  - Resposta !ok → ApiClientError(code, message, status)
 *  - Network failure (TypeError no fetch) → ApiClientError("NETWORK_ERROR", ..., 0)
 *  - 401 fora do login → emite 'radar:auth-expired' (handler global no layout faz logout)
 *
 * Pra mensagens amigáveis no consumidor, use `toFriendlyError` de ./error-messages.
 */
import type { ApiError } from "@radar/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const TOKEN_KEY = "radar:token";

/**
 * Codes 401 que indicam sessão inválida/expirada (devem deslogar).
 * Outros 401 (ex.: INVALID_CURRENT_PASSWORD) NÃO disparam logout.
 */
const AUTH_EXPIRED_CODES = new Set(["UNAUTHORIZED", "SESSION_INVALID"]);

/** Evento global emitido quando a sessão expira. Handler fica no layout autenticado. */
export const AUTH_EXPIRED_EVENT = "radar:auth-expired";

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body" | "headers"> {
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(TOKEN_KEY);
  },
  set: (token: string): void => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(TOKEN_KEY, token);
  },
  clear: (): void => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(TOKEN_KEY);
  },
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers = {}, skipAuth, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (!skipAuth) {
    const token = tokenStorage.get();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    // Network failure (server down, sem internet, CORS bloqueando, etc.)
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiClientError("NETWORK_ERROR", "Sem conexão. Verifique sua internet.", 0);
  }

  if (!res.ok) {
    let payload: ApiError;
    try {
      payload = (await res.json()) as ApiError;
    } catch {
      payload = { code: "UNKNOWN_ERROR", message: "Erro desconhecido" };
    }

    // Sessão expirada: emite evento global pro layout deslogar (mas só se já tinha token)
    if (
      res.status === 401 &&
      AUTH_EXPIRED_CODES.has(payload.code) &&
      !skipAuth &&
      tokenStorage.get() &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }

    throw new ApiClientError(payload.code, payload.message, res.status, payload.details);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
