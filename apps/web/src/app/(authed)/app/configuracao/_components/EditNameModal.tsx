/**
 * EditNameModal — edita nome completo (≥2 palavras).
 * Mostra success por ~1.5s antes de fechar.
 */
"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, FormField, Input } from "@radar/ui";

import { ApiClientError } from "@/lib/api";
import { toFriendlyError } from "@/lib/error-messages";
import { usersApi } from "@/lib/users-api";
import { useAuthStore } from "@/stores/auth.store";

import { EditFieldModal, type EditFieldModalSuccess } from "./EditFieldModal";

export interface EditNameModalProps {
  open: boolean;
  currentName: string;
  onClose: () => void;
}

export function EditNameModal({ open, currentName, onClose }: EditNameModalProps): JSX.Element {
  const setSession = useAuthStore((s) => s.setSession);
  const sessionId = useAuthStore((s) => s.sessionId);

  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(currentName);
      setError(null);
      setSaving(false);
    }
  }, [open, currentName]);
  const [success, setSuccess] = useState<EditFieldModalSuccess | null>(null);

  const isValid = (() => {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter((p) => p.length >= 2);
    return parts.length >= 2;
  })();
  const changed = name.trim() !== currentName;
  const canSave = isValid && changed && !saving;

  const onSave = async (): Promise<void> => {
    if (!canSave) return;
    setError(null);
    setSaving(true);
    try {
      const res = await usersApi.updateProfile({ name: name.trim() });
      if (sessionId) setSession(res.user, sessionId);
      setSuccess({
        title: "Nome alterado!",
        description: "Suas mudanças foram salvas.",
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
      title="Editar nome"
      description="Como você quer ser identificado na plataforma."
      onClose={onClose}
      successState={success}
    >
      <FormField label="Nome completo" htmlFor="name" hint="Nome e sobrenome.">
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void onSave();
          }}
          disabled={saving}
          placeholder="Nome e sobrenome"
          autoComplete="name"
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
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </EditFieldModal>
  );
}
