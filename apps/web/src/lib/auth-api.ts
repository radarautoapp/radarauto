/**
 * lib/auth.ts
 *
 * Wrapper tipado dos endpoints de auth.
 */
import type {
  AuthResponse,
  LoginRequest,
  MeResponse,
  RegisterLojistaRequest,
  RegisterRevendedorRequest,
} from "@radar/types";

import { apiFetch, tokenStorage } from "./api";

export const authApi = {
  async checkEmail(email: string): Promise<{ available: boolean }> {
    return apiFetch<{ available: boolean }>("/auth/check-email", {
      method: "POST",
      body: { email },
      skipAuth: true,
    });
  },

  async checkCpf(cpf: string): Promise<{ available: boolean }> {
    return apiFetch<{ available: boolean }>("/auth/check-cpf", {
      method: "POST",
      body: { cpf },
      skipAuth: true,
    });
  },

  async registerRevendedor(input: RegisterRevendedorRequest): Promise<AuthResponse> {
    const data = await apiFetch<AuthResponse>("/auth/register/revendedor", {
      method: "POST",
      body: input,
      skipAuth: true,
    });
    tokenStorage.setSession(data.token, data.refreshToken, data.sessionId);
    return data;
  },

  async registerLojista(input: RegisterLojistaRequest): Promise<AuthResponse> {
    const data = await apiFetch<AuthResponse>("/auth/register/lojista", {
      method: "POST",
      body: input,
      skipAuth: true,
    });
    tokenStorage.setSession(data.token, data.refreshToken, data.sessionId);
    return data;
  },

  async login(input: LoginRequest): Promise<AuthResponse> {
    const data = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: input,
      skipAuth: true,
    });
    tokenStorage.setSession(data.token, data.refreshToken, data.sessionId);
    return data;
  },

  async me(): Promise<MeResponse> {
    return apiFetch<MeResponse>("/auth/me");
  },

  async logout(): Promise<void> {
    try {
      await apiFetch<void>("/auth/logout", { method: "POST" });
    } finally {
      tokenStorage.clear();
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await apiFetch<{ revoked: number }>("/auth/logout-all", { method: "POST" });
    } finally {
      tokenStorage.clear();
    }
  },
};
