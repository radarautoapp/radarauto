/**
 * useAuthExpired
 *
 * Hook que escuta o evento global 'radar:auth-expired' emitido pelo apiFetch
 * quando uma request retorna 401 com code UNAUTHORIZED/SESSION_INVALID.
 *
 * Ação: limpa o store de auth + redireciona pra /login.
 * Garante 1 disparo só usando flag local (várias requests paralelas não causam múltiplos redirects).
 */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { AUTH_EXPIRED_EVENT, tokenStorage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";

export function useAuthExpired(): void {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);
  const firedRef = useRef(false);

  useEffect(() => {
    const handler = (): void => {
      if (firedRef.current) return;
      firedRef.current = true;
      tokenStorage.clear();
      clearSession();
      router.replace("/login?expired=1");
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handler);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handler);
    };
  }, [router, clearSession]);
}
