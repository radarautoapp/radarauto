/**
 * stores/auth.store.ts
 *
 * Estado de autenticação do client (Regra 24: Zustand pra client state).
 * Server state (validação de sessão) fica em TanStack Query.
 *
 * NÃO armazena token (token vai em sessionStorage via lib/api).
 */
import type { User } from "@radar/types";
import { create } from "zustand";

interface AuthState {
  user: User | null;
  sessionId: string | null;
  isHydrated: boolean;
  setSession: (user: User, sessionId: string) => void;
  clearSession: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  sessionId: null,
  isHydrated: false,
  setSession: (user, sessionId) => set({ user, sessionId }),
  clearSession: () => set({ user: null, sessionId: null }),
  markHydrated: () => set({ isHydrated: true }),
}));
