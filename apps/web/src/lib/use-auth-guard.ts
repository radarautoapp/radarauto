/**
 * useAuthGuard
 *
 * Hook que protege rotas autenticadas no client. Redireciona pra /login
 * se não houver sessão válida.
 *
 * IMPORTANTE: complementa, não substitui, a proteção do backend.
 * O server SEMPRE valida JWT (Regra 5, 7). Isso aqui é só UX.
 */
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { tokenStorage } from "./api";
import { useSession } from "./use-session";

export function useAuthGuard(): { ready: boolean; isAuthenticated: boolean } {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useSession();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasToken = !!tokenStorage.get();
    if (!hasToken) {
      router.replace("/login");
      return;
    }
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [router, isAuthenticated, isLoading]);

  return {
    ready: !isLoading && isAuthenticated,
    isAuthenticated: !!user,
  };
}
