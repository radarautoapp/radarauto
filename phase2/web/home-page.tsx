/**
 * Home Page
 *
 * Mostra status de autenticação e CTAs.
 * Será substituída pelo Marketplace na Fase 4.
 */
"use client";

import { useRouter } from "next/navigation";

import { authApi } from "@/lib/auth-api";
import { useSession } from "@/lib/use-session";
import { useAuthStore } from "@/stores/auth.store";

export default function HomePage(): JSX.Element {
  const { user, isAuthenticated, isLoading } = useSession();
  const clearSession = useAuthStore((s) => s.clearSession);
  const router = useRouter();

  const onLogout = async (): Promise<void> => {
    await authApi.logout();
    clearSession();
    router.push("/login");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-lg text-center">
        <div className="display text-3xl font-bold text-text mb-2">RadarAuto</div>

        {isLoading && <p className="text-muted text-sm">Carregando...</p>}

        {!isLoading && !isAuthenticated && (
          <>
            <p className="text-muted text-sm mb-6">Faça login ou crie sua conta para começar.</p>
            <div className="flex flex-col gap-3">
              <a
                href="/login"
                className="px-5 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-colors"
              >
                Entrar
              </a>
              <a
                href="/cadastro"
                className="px-5 py-3 rounded-lg border border-border text-text font-semibold hover:bg-bg-2 transition-colors"
              >
                Criar conta
              </a>
            </div>
          </>
        )}

        {!isLoading && isAuthenticated && user && (
          <>
            <p className="text-muted text-sm mb-2">Bem-vindo,</p>
            <p className="display text-lg font-bold text-text mb-1">{user.name}</p>
            <p className="text-muted text-xs mb-6">
              {user.email} · <span className="capitalize">{user.role}</span>
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 text-success font-semibold text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Autenticado
            </div>
            <button
              onClick={onLogout}
              className="block w-full px-5 py-3 rounded-lg border border-border text-text font-semibold hover:bg-bg-2 transition-colors"
            >
              Sair
            </button>
          </>
        )}
      </div>
    </main>
  );
}
