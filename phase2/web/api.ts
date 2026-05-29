/**
 * lib/api.ts
 *
 * Propósito: cliente HTTP minimalista pra falar com a @radar/api.
 * Single source pra fetch — facilita adicionar token, headers, error handling.
 *
 * Token de sessão fica em cookie httpOnly (vamos setar via API route do Next).
 * Por ora: armazenado em sessionStorage no client (será migrado pra cookie).
 */
import type { ApiError } from "@radar/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const TOKEN_KEY = "radar:token";

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

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let payload: ApiError;
    try {
      payload = (await res.json()) as ApiError;
    } catch {
      payload = { code: "UNKNOWN_ERROR", message: "Erro desconhecido" };
    }
    throw new ApiClientError(payload.code, payload.message, res.status, payload.details);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
