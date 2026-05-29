/**
 * useSession
 *
 * Hook que sincroniza estado de auth no boot do app.
 * Lê token de sessionStorage e valida via GET /auth/me.
 * Atualiza store ou limpa se inválido.
 *
 * Server state via TanStack Query — refetcha em foco da janela (Regra 24).
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { ApiClientError, tokenStorage } from "@/lib/api";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/stores/auth.store";

export function useSession() {
  const { user, setSession, clearSession, markHydrated, isHydrated } = useAuthStore();

  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
    enabled: typeof window !== "undefined" && !!tokenStorage.get(),
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isHydrated) markHydrated();
  }, [isHydrated, markHydrated]);

  useEffect(() => {
    if (query.data) {
      setSession(query.data.user, query.data.session.id);
    } else if (
      query.isError &&
      query.error instanceof ApiClientError &&
      query.error.status === 401
    ) {
      tokenStorage.clear();
      clearSession();
    }
  }, [query.data, query.isError, query.error, setSession, clearSession]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading: query.isLoading && !!tokenStorage.get(),
  };
}
