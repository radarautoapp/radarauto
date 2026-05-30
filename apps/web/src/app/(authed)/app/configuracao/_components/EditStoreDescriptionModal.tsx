/**
 * EditStoreDescriptionModal — bio da loja (textarea, máx 500 chars).
 */
"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, FormField } from "@radar/ui";

import { toFriendlyError } from "@/lib/error-messages";
import { storesApi } from "@/lib/stores-api";

import { EditFieldModal, type EditFieldModalSuccess } from "./EditFieldModal";

const MAX = 500;

export interface EditStoreDescriptionModalProps {
  open: boolean;
  currentDescription: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditStoreDescriptionModal({
  open,
  currentDescription,
  onClose,
  onUpdated,
}: EditStoreDescriptionModalProps): JSX.Element {
  const [text, setText] = useState(currentDescription ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<EditFieldModalSuccess | null>(null);

  useEffect(() => {
    if (open) {
      setText(currentDescription ?? "");
      setError(null);
      setSuccess(null);
      setSaving(false);
    }
  }, [open]);

  const trimmed = text.trim();
  const isValid = trimmed.length <= MAX;
  const changed = trimmed !== (currentDescription ?? "");
  const canSave = isValid && changed && !saving;

  const remaining = MAX - text.length;

  const onSave = async (): Promise<void> => {
    if (!canSave) return;
    setError(null);
    setSaving(true);
    try {
      await storesApi.updateMine({ description: trimmed });
      onUpdated();
      setSuccess({
        title: "Descrição atualizada!",
        description: trimmed ? "Sua descrição foi salva." : "Descrição removida.",
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
      title="Editar descrição"
      description="Conte o que sua loja oferece (atendimento, especialidades, diferencial)."
      onClose={onClose}
      successState={success}
    >
      <FormField
        label="Descrição"
        htmlFor="store-description"
        hint={`${remaining} caracteres restantes`}
      >
        <textarea
          id="store-description"
          className="inp"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX + 50))}
          disabled={saving}
          placeholder="Ex.: Trabalhamos com seminovos selecionados há 12 anos, todos os veículos passam por revisão completa antes da venda..."
          rows={6}
          style={{ resize: "vertical", minHeight: 120, fontFamily: "var(--sans)" }}
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
