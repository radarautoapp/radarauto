/**
 * ConfirmModal
 *
 * Variante do EditFieldModal pra confirmação de ações destrutivas.
 * Pequeno, focado em decisão sim/não. Suporta variant "danger".
 */
"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@radar/ui";

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  loading,
  onConfirm,
  onClose,
}: ConfirmModalProps): JSX.Element | null {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, loading]);

  if (!open) return null;

  return (
    <div
      className="edit-modal-backdrop"
      onClick={() => {
        if (!loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="edit-modal confirm-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420 }}
      >
        <header className="edit-modal-head">
          <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 12, alignItems: "flex-start" }}>
            {variant === "danger" && (
              <div className="confirm-ic confirm-ic-danger">
                <AlertTriangle size={20} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 className="edit-modal-title">{title}</h2>
              <p className="edit-modal-desc">{description}</p>
            </div>
          </div>
          <button
            type="button"
            className="edit-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </header>
        <div className="edit-modal-body" style={{ paddingTop: 4 }}>
          <div
            className="edit-modal-foot"
            style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}
          >
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button
              variant={variant === "danger" ? "danger" : "primary"}
              onClick={onConfirm}
              loading={loading}
              disabled={loading}
            >
              {loading ? "..." : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
