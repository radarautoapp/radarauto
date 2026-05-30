/**
 * EditStoreNameModal — edita nome de exibição da loja.
 * Sem regra de 2 palavras (loja pode ser "FlashCar").
 */
"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, FormField, Input } from "@radar/ui";

import { toFriendlyError } from "@/lib/error-messages";
import { storesApi } from "@/lib/stores-api";

import { EditFieldModal, type EditFieldModalSuccess } from "./EditFieldModal";

export interface EditStoreNameModalProps {
  open: boolean;
  currentName: string;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditStoreNameModal({
  open,
  currentName,
  onClose,
  onUpdated,
}: EditStoreNameModalProps): JSX.Element {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<EditFieldModalSuccess | null>(null);

  useEffect(() => {
    if (open) {
      setName(currentName);
      setError(null);
      setSuccess(null);
      setSaving(false);
    }
  }, [open]);

  const isValid = name.trim().length >= 2;
  const changed = name.trim() !== currentName;
  const canSave = isValid && changed && !saving;

  const onSave = async (): Promise<void> => {
    if (!canSave) return;
    setError(null);
    setSaving(true);
    try {
      await storesApi.updateMine({ name: name.trim() });
      onUpdated();
      setSuccess({
        title: "Nome da loja atualizado!",
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
      title="Editar nome da loja"
      description="Esse é o nome que aparece pros clientes na plataforma."
      onClose={onClose}
      successState={success}
    >
      <FormField label="Nome de exibição" htmlFor="store-name">
        <Input
          id="store-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void onSave();
          }}
          disabled={saving}
          placeholder="Ex.: FlashCar Centro"
          autoComplete="organization"
          maxLength={80}
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
