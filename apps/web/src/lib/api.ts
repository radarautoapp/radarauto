/**
 * lib/api.ts
 *
 * Cliente HTTP minimalista pra falar com a @radar/api.
 * Single source pra fetch — facilita adicionar token, headers, error handling.
 *
 * Tokens ficam em localStorage (persistem ao fechar o navegador).
 * Access token (curto) + refresh token (longo). No 401 por expiração,
 * tenta renovar via /auth/refresh (com retry) antes de deslogar.
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
const REFRESH_KEY = "radar:refresh";
const SESSION_KEY = "radar:session";

/**
 * Codes 401 que indicam sessão inválida/expirada (devem deslogar).
 * Outros 401 (ex.: INVALID_CURRENT_PASSWORD) NÃO disparam logout.
 */
const AUTH_EXPIRED_CODES = new Set(["UNAUTHORIZED", "SESSION_INVALID", "REFRESH_INVALID"]);

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
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set: (token: string): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear: (): void => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem(SESSION_KEY);
  },
  getRefresh: (): string | null => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  getSessionId: (): string | null => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(SESSION_KEY);
  },
  /** Guarda os 3 valores de uma vez (apos login/registro). */
  setSession: (token: string, refreshToken: string, sessionId: string): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(REFRESH_KEY, refreshToken);
    window.localStorage.setItem(SESSION_KEY, sessionId);
  },
};

/**
 * Renovação de access token via refresh token.
 *
 * Uma única renovação em andamento por vez (fila): se várias requisições
 * baterem 401 ao mesmo tempo, todas aguardam a MESMA promise de refresh,
 * evitando uma tempestade de chamadas a /auth/refresh.
 */
let refreshInFlight: Promise<boolean> | null = null;

async function callRefreshOnce(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefresh();
  const sessionId = tokenStorage.getSessionId();
  if (!refreshToken || !sessionId) return false;

  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { token?: string };
    if (!data.token) return false;
    tokenStorage.set(data.token);
    return true;
  } catch {
    return false;
  }
}

/**
 * Tenta renovar o token até `maxAttempts` vezes. Reusa a renovação em
 * andamento se já houver uma (fila). Retorna true se renovou.
 */
async function tryRefresh(maxAttempts = 3): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const ok = await callRefreshOnce();
      if (ok) return true;
      // pequeno intervalo entre tentativas (200ms, 400ms, ...)
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, attempt * 200));
    }
    return false;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function executeRequest(path: string, options: RequestOptions): Promise<Response> {
  const { body, headers = {}, skipAuth, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (!skipAuth) {
    const token = tokenStorage.get();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  return fetch(`${API_URL}/api/v1${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth } = options;

  let res: Response;
  try {
    res = await executeRequest(path, options);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiClientError("NETWORK_ERROR", "Sem conexão. Verifique sua internet.", 0);
  }

  // Access token expirado: tenta renovar via refresh token e refaz a requisição UMA vez.
  // Só faz sentido se a request usa auth, tínhamos um token, e não é a própria rota de refresh.
  if (
    res.status === 401 &&
    !skipAuth &&
    !path.startsWith("/auth/refresh") &&
    tokenStorage.get() &&
    tokenStorage.getRefresh() &&
    typeof window !== "undefined"
  ) {
    const renewed = await tryRefresh();
    if (renewed) {
      try {
        res = await executeRequest(path, options);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") throw err;
        throw new ApiClientError("NETWORK_ERROR", "Sem conexão. Verifique sua internet.", 0);
      }
    }
  }

  if (!res.ok) {
    let payload: ApiError;
    try {
      payload = (await res.json()) as ApiError;
    } catch {
      payload = { code: "UNKNOWN_ERROR", message: "Erro desconhecido" };
    }

    // Sessão de fato expirada (refresh falhou ou não aplicável): emite evento global
    // pro layout deslogar (mas só se já tinha token).
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
