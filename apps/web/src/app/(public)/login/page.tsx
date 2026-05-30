/**
 * /login page
 *
 * Refeita usando @radar/ui components (Regra 2: design first com protótipo validado).
 * Visual matching: card centralizado, fundo radial sutil, brand mark, tipografia Sora,
 * inputs com .inp do design system, botão primary com sombra.
 *
 * Sem lógica de negócio aqui — só chama authApi.login (Regras 5, 6).
 */
"use client";

import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { BrandLogo, Button, FormField, Input, PasswordInput } from "@radar/ui";

import { ApiClientError } from "@/lib/api";
import { toFriendlyError } from "@/lib/error-messages";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/stores/auth.store";

export default function LoginPage(): JSX.Element {
  const searchParams = useSearchParams();
  const expiredNotice =
    searchParams.get("expired") === "1" ? "Sessão expirada. Faça login de novo." : null;

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
      router.push("/app");
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <BrandLogo />

        <h1 className="auth-title">Entrar</h1>
        <p className="auth-sub">Acesse sua conta para continuar.</p>

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <FormField label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="seu@email.com"
            />
          </FormField>

          <FormField label="Senha" htmlFor="password">
            <PasswordInput
              id="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
            />
          </FormField>

          {error && (
            <div className="auth-error" role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            block
            loading={loading}
            disabled={!email || !password}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="auth-foot">
          Não tem conta? <a href="/cadastro">Criar agora</a>
        </div>
      </div>
    </main>
  );
}
