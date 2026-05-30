/**
 * InviteEmployeeModal — modal pra convidar novo funcionário.
 * Só pede email; o funcionário define nome/senha no aceite.
 */
"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, FormField, Input } from "@radar/ui";

import { toFriendlyError } from "@/lib/error-messages";
import { employeesApi } from "@/lib/employees-api";

import {
  EditFieldModal,
  type EditFieldModalSuccess,
} from "../../configuracao/_components/EditFieldModal";

export interface InviteEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
}

export function InviteEmployeeModal({
  open,
  onClose,
  onInvited,
}: InviteEmployeeModalProps): JSX.Element {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<EditFieldModalSuccess | null>(null);

  useEffect(() => {
    if (open) {
      setEmail("");
      setError(null);
      setSuccess(null);
      setSaving(false);
    }
  }, [open]);

  const trimmed = email.trim().toLowerCase();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  const canSave = isValid && !saving;

  const onSave = async (): Promise<void> => {
    if (!canSave) return;
    setError(null);
    setSaving(true);
    try {
      await employeesApi.invite({ email: trimmed });
      onInvited();
      setSuccess({
        title: "Convite enviado!",
        description: `Email enviado pra ${trimmed}.`,
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
      title="Convidar funcionário"
      description="Vamos enviar um email com link pra essa pessoa criar a senha e ativar a conta."
      onClose={onClose}
      successState={success}
    >
      <FormField label="Email do funcionário" htmlFor="employee-email">
        <Input
          id="employee-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void onSave();
          }}
          disabled={saving}
          placeholder="email@exemplo.com"
          autoComplete="email"
          autoFocus
          required
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
          {saving ? "Enviando..." : "Enviar convite"}
        </Button>
      </div>
    </EditFieldModal>
  );
}
