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
  async registerRevendedor(input: RegisterRevendedorRequest): Promise<AuthResponse> {
    const data = await apiFetch<AuthResponse>("/auth/register/revendedor", {
      method: "POST",
      body: input,
      skipAuth: true,
    });
    tokenStorage.set(data.token);
    return data;
  },

  async registerLojista(input: RegisterLojistaRequest): Promise<AuthResponse> {
    const data = await apiFetch<AuthResponse>("/auth/register/lojista", {
      method: "POST",
      body: input,
      skipAuth: true,
    });
    tokenStorage.set(data.token);
    return data;
  },

  async login(input: LoginRequest): Promise<AuthResponse> {
    const data = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: input,
      skipAuth: true,
    });
    tokenStorage.set(data.token);
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
