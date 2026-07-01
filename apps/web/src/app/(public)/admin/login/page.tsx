/**
 * /admin/login page
 *
 * Login exclusivo para administradores da plataforma (nao e para
 * lojistas/revendedores - esses usam /login). Mesmo backend de autenticacao;
 * so a porta de entrada e visual sao dedicados. Bloqueia (e desloga na hora)
 * quem nao for role "admin".
 */
"use client";

import { AlertCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, FormField, Input, PasswordInput } from "@radar/ui";

import { toFriendlyError } from "@/lib/error-messages";
import { authApi } from "@/lib/auth-api";
import { tokenStorage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";

export default function AdminLoginPage(): JSX.Element {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
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

      if (res.user.role !== "admin") {
        // Nao e admin: nao persiste sessao nenhuma nessa porta.
        tokenStorage.clear();
        clearSession();
        setError("Este acesso é exclusivo para administradores.");
        return;
      }

      setSession(res.user, res.sessionId);
      router.push("/app/admin/dashboard");
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div
          className="auth-logo-center"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
        >
          <ShieldCheck size={32} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Painel Administrativo</span>
        </div>

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
              placeholder="admin@radarauto.app"
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
      </div>
    </main>
  );
}
