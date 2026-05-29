/**
 * /cadastro page
 *
 * Switcher entre cadastro de Revendedor e Lojista.
 * Cadastro de Funcionário é só pelo painel do lojista.
 */
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiClientError } from "@/lib/api";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/stores/auth.store";

type Tab = "revendedor" | "lojista";

export default function CadastroPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [tab, setTab] = useState<Tab>("revendedor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [common, setCommon] = useState({ name: "", email: "", password: "" });
  const [store, setStore] = useState({
    storeName: "",
    storePhone: "",
    storeCity: "",
    storeState: "",
  });

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res =
        tab === "revendedor"
          ? await authApi.registerRevendedor(common)
          : await authApi.registerLojista({ ...common, ...store });
      setSession(res.user, res.sessionId);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else setError("Não foi possível criar a conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-lg">
        <div className="display text-2xl font-bold text-text mb-1">Criar conta</div>
        <p className="text-muted text-sm mb-6">Escolha o tipo de conta para começar.</p>

        <div className="flex gap-2 p-1 bg-bg-2 rounded-lg mb-6">
          {(["revendedor", "lojista"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-colors ${
                tab === t ? "bg-card shadow text-text" : "text-muted hover:text-text"
              }`}
            >
              {t === "revendedor" ? "Revendedor" : "Lojista"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field
            label="Nome"
            value={common.name}
            onChange={(v) => setCommon({ ...common, name: v })}
            disabled={loading}
          />
          <Field
            label="Email"
            type="email"
            value={common.email}
            onChange={(v) => setCommon({ ...common, email: v })}
            disabled={loading}
          />
          <Field
            label="Senha (mín. 8 caracteres)"
            type="password"
            value={common.password}
            onChange={(v) => setCommon({ ...common, password: v })}
            disabled={loading}
          />

          {tab === "lojista" && (
            <>
              <div className="h-px bg-border my-1" />
              <Field
                label="Nome da loja"
                value={store.storeName}
                onChange={(v) => setStore({ ...store, storeName: v })}
                disabled={loading}
              />
              <Field
                label="Telefone da loja"
                value={store.storePhone}
                onChange={(v) => setStore({ ...store, storePhone: v })}
                disabled={loading}
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <Field
                    label="Cidade"
                    value={store.storeCity}
                    onChange={(v) => setStore({ ...store, storeCity: v })}
                    disabled={loading}
                  />
                </div>
                <div className="w-24">
                  <Field
                    label="UF"
                    value={store.storeState}
                    onChange={(v) =>
                      setStore({ ...store, storeState: v.toUpperCase().slice(0, 2) })
                    }
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          )}

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
            disabled={loading}
            className="mt-2 px-5 py-3 rounded-lg bg-primary text-white font-semibold disabled:opacity-50 hover:bg-primary-hover transition-colors"
          >
            {loading ? "Criando..." : "Criar conta"}
          </button>

          <div className="text-center text-sm text-muted">
            Já tem conta?{" "}
            <a href="/login" className="text-primary font-semibold hover:underline">
              Entrar
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  disabled,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}): JSX.Element {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="px-4 py-3 rounded-lg border border-border bg-card text-text focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}
