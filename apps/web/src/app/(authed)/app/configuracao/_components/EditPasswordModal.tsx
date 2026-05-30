/**
 * EditPasswordModal — troca senha com validação de senha atual.
 * Success mostra contador de sessões revogadas.
 */
"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, FormField, PasswordInput } from "@radar/ui";

import { ApiClientError } from "@/lib/api";
import { toFriendlyError } from "@/lib/error-messages";
import { usersApi } from "@/lib/users-api";

import { EditFieldModal, type EditFieldModalSuccess } from "./EditFieldModal";

export interface EditPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function EditPasswordModal({ open, onClose }: EditPasswordModalProps): JSX.Element {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<EditFieldModalSuccess | null>(null);

  useEffect(() => {
    if (open) {
      setCurrent("");
      setNext("");
      setConfirm("");
      setError(null);
      setSuccess(null);
      setSaving(false);
    }
  }, [open]);

  const matchError = confirm && next !== confirm ? "As senhas não coincidem." : null;
  const canSave =
    current.length >= 1 && next.length >= 8 && next === confirm && !saving && !success;

  const onSave = async (): Promise<void> => {
    if (!canSave) return;
    setError(null);
    setSaving(true);
    try {
      const res = await usersApi.changePassword({
        currentPassword: current,
        newPassword: next,
      });
      setSuccess({
        title: "Senha alterada!",
        description:
          res.revokedSessions > 0
            ? `${res.revokedSessions} outro(s) dispositivo(s) foram desconectados por segurança.`
            : "Sua nova senha já está ativa.",
      });
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 2000);
    } catch (err) {
      setError(toFriendlyError(err));
      setSaving(false);
    }
  };

  return (
    <EditFieldModal
      open={open}
      title="Trocar senha"
      description="Outras sessões abertas serão desconectadas por segurança."
      onClose={onClose}
      successState={success}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FormField label="Senha atual" htmlFor="cur-pw">
          <PasswordInput
            id="cur-pw"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            disabled={saving}
            autoComplete="current-password"
            placeholder="••••••••"
            autoFocus
          />
        </FormField>

        <FormField label="Nova senha" htmlFor="new-pw" hint="Mínimo 8 caracteres.">
          <PasswordInput
            id="new-pw"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            disabled={saving}
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
          />
        </FormField>

        <FormField label="Confirmar nova senha" htmlFor="conf-pw" error={matchError}>
          <PasswordInput
            id="conf-pw"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={saving}
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            invalid={!!matchError}
          />
        </FormField>
      </div>

      {error && (
        <div key={error} className="auth-error" role="alert" style={{ marginTop: 12 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      <div className="edit-modal-foot">
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onSave} disabled={!canSave} loading={saving}>
          {saving ? "Alterando..." : "Alterar senha"}
        </Button>
      </div>
    </EditFieldModal>
  );
}
