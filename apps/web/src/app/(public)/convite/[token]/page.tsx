/**
 * /convite/[token]
 *
 * Página pública pra funcionário aceitar o convite.
 *
 * Fluxo:
 *  1. Lê token da URL
 *  2. GET /employees/invite/:token → email + storeName + expiresAt
 *  3. Mostra form: nome + senha (com confirmação) + telefone (opcional)
 *  4. POST /employees/invite/:token → cria senha e ativa conta
 *  5. Redireciona pra /login com query ?activated=1
 */
"use client";

import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import type { InviteInfoResponse } from "@radar/types";
import { Brand, Button, FormField, Input, PasswordInput, Skeleton } from "@radar/ui";

import { toFriendlyError } from "@/lib/error-messages";
import { employeesApi } from "@/lib/employees-api";

export default function ConvitePage(): JSX.Element {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;

  const [info, setInfo] = useState<InviteInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await employeesApi.getInvite(token);
        if (!cancelled) setInfo(res);
      } catch (err) {
        if (!cancelled) setLoadError(toFriendlyError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const nameOk = name.trim().length >= 2;
  const passwordOk = password.length >= 8;
  const confirmOk = password === confirm;
  const canSave = nameOk && passwordOk && confirmOk && !saving;

  const onSubmit = async (): Promise<void> => {
    if (!canSave) return;
    setSaveError(null);
    setSaving(true);
    try {
      await employeesApi.acceptInvite(token, {
        name: name.trim(),
        password,
      });
      setActivated(true);
      setTimeout(() => {
        router.replace("/login?activated=1");
      }, 1800);
    } catch (err) {
      setSaveError(toFriendlyError(err));
      setSaving(false);
    }
  };

  return (
    <div className="convite-wrap">
      <div className="convite-card">
        <div className="convite-brand">
          <Brand size="md" />
        </div>

        {loading && (
          <>
            <Skeleton width="60%" height="28px" />
            <div style={{ height: 12 }} />
            <Skeleton height="16px" />
            <div style={{ height: 24 }} />
            <Skeleton height="48px" />
            <div style={{ height: 12 }} />
            <Skeleton height="48px" />
          </>
        )}

        {!loading && loadError && (
          <div className="convite-error-state">
            <AlertCircle size={32} className="convite-error-icon" />
            <h1>Convite inválido</h1>
            <p>{loadError}</p>
            <Button variant="primary" onClick={() => router.replace("/login")}>
              Ir pra login
            </Button>
          </div>
        )}

        {!loading && info && activated && (
          <div className="convite-success">
            <div className="convite-success-icon">
              <CheckCircle2 size={48} />
            </div>
            <h1>Conta ativada!</h1>
            <p>Redirecionando pra login...</p>
          </div>
        )}

        {!loading && info && !activated && (
          <>
            <h1 className="convite-title">Você foi convidado</h1>
            <p className="convite-sub">
              <strong>{info.storeName}</strong> convidou você pra fazer parte da equipe.
            </p>
            <div className="convite-email">
              <Mail size={16} />
              <span>{info.email}</span>
            </div>

            <div style={{ height: 24 }} />

            <FormField label="Seu nome completo" htmlFor="convite-name">
              <Input
                id="convite-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                placeholder="Maria Silva"
                autoComplete="name"
                autoFocus
                required
              />
            </FormField>

            <FormField
              label="Crie uma senha"
              htmlFor="convite-password"
              hint="Mínimo 8 caracteres."
            >
              <PasswordInput
                id="convite-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={saving}
                autoComplete="new-password"
                placeholder="••••••••"
                required
              />
            </FormField>

            <FormField label="Confirme a senha" htmlFor="convite-confirm">
              <PasswordInput
                id="convite-confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void onSubmit();
                }}
                disabled={saving}
                autoComplete="new-password"
                placeholder="••••••••"
                required
              />
              {confirm.length > 0 && !confirmOk && (
                <div className="form-hint error">As senhas não coincidem.</div>
              )}
            </FormField>

            {saveError && (
              <div key={saveError} className="auth-error" role="alert" style={{ marginTop: 12 }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{saveError}</span>
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <Button
                variant="primary"
                onClick={onSubmit}
                disabled={!canSave}
                loading={saving}
                fullWidth
              >
                {saving ? "Ativando conta..." : "Ativar conta"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
