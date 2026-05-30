/**
 * EditStoreEmailModal — email comercial (sem OTP no MVP).
 */
"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, FormField, Input } from "@radar/ui";

import { toFriendlyError } from "@/lib/error-messages";
import { storesApi } from "@/lib/stores-api";

import { EditFieldModal, type EditFieldModalSuccess } from "./EditFieldModal";

export interface EditStoreEmailModalProps {
  open: boolean;
  currentEmail: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditStoreEmailModal({
  open,
  currentEmail,
  onClose,
  onUpdated,
}: EditStoreEmailModalProps): JSX.Element {
  const [email, setEmail] = useState(currentEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<EditFieldModalSuccess | null>(null);

  useEffect(() => {
    if (open) {
      setEmail(currentEmail ?? "");
      setError(null);
      setSuccess(null);
      setSaving(false);
    }
  }, [open]);

  const trimmed = email.trim().toLowerCase();
  const isValid = trimmed.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  const changed = trimmed !== (currentEmail ?? "");
  const canSave = isValid && changed && !saving;

  const onSave = async (): Promise<void> => {
    if (!canSave) return;
    setError(null);
    setSaving(true);
    try {
      await storesApi.updateMine({ email: trimmed });
      onUpdated();
      setSuccess({
        title: "Email comercial atualizado!",
        description: trimmed ? trimmed : "Email removido.",
      });
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(toFriendlyError(err));
      setSaving(false);
    }
  };

  return (
    <EditFieldModal
      open={open}
      title="Editar email comercial"
      description="Pode ser diferente do email pessoal do dono."
      onClose={onClose}
      successState={success}
    >
      <FormField label="Email comercial" htmlFor="store-email" hint="Deixe em branco pra remover.">
        <Input
          id="store-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void onSave();
          }}
          disabled={saving}
          placeholder="contato@minhaloja.com.br"
          autoComplete="email"
          maxLength={255}
        />
      </FormField>

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
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </EditFieldModal>
  );
}
