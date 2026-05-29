/**
 * /login page
 *
 * UX simples: card centralizado, mobile-first (Regra 3).
 * Estados: idle, loading, error.
 * Sem regra de negócio aqui — só chama authApi.login (Regra 6).
 */
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiClientError } from "@/lib/api";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/stores/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const deviceLabel = navigator.userAgent.split(" ").slice(-1)[0] ?? "Browser";
      const res = await authApi.login({ email, password, deviceLabel });
      setSession(res.user, res.sessionId);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else setError("Não foi possível fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-lg">
        <div className="display text-2xl font-bold text-text mb-1">Entrar no RadarAuto</div>
        <p className="text-muted text-sm mb-6">Acesse sua conta com email e senha.</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="px-4 py-3 rounded-lg border border-border bg-card text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Senha</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="px-4 py-3 rounded-lg border border-border bg-card text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          {error && (
            <div
              role="alert"
              className="px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-medium"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="mt-2 px-5 py-3 rounded-lg bg-primary text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="text-center text-sm text-muted mt-2">
            Não tem conta?{" "}
            <a href="/cadastro" className="text-primary font-semibold hover:underline">
              Criar agora
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
