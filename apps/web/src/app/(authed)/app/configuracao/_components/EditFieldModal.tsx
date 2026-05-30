/**
 * EditFieldModal
 *
 * Modal genérico pra edição de campo do perfil.
 * Desktop: centrado 480px. Mobile (≤640px): bottom-sheet.
 *
 * Features:
 *  - Backdrop clicável fecha (desabilitado em successState)
 *  - ESC fecha (desabilitado em successState)
 *  - Body scroll lock
 *  - successState: substitui body por splash de sucesso com check animado
 */
"use client";

import { Check, X } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";

export interface EditFieldModalSuccess {
  title: string;
  description?: string;
}

export interface EditFieldModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  successState?: EditFieldModalSuccess | null;
  children: ReactNode;
}

export function EditFieldModal({
  open,
  title,
  description,
  onClose,
  successState,
  children,
}: EditFieldModalProps): JSX.Element | null {
  const inSuccess = !!successState;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && !inSuccess) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, inSuccess]);

  if (!open) return null;

  return (
    <div
      className="edit-modal-backdrop"
      onClick={() => {
        if (!inSuccess) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        {inSuccess ? (
          <div className="edit-modal-success">
            <div className="edit-modal-success-ic">
              <Check size={36} strokeWidth={3} />
            </div>
            <h2 className="edit-modal-success-title">{successState.title}</h2>
            {successState.description && (
              <p className="edit-modal-success-desc">{successState.description}</p>
            )}
          </div>
        ) : (
          <>
            <header className="edit-modal-head">
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 id="edit-modal-title" className="edit-modal-title">
                  {title}
                </h2>
                {description && <p className="edit-modal-desc">{description}</p>}
              </div>
              <button
                type="button"
                className="edit-modal-close"
                onClick={onClose}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </header>
            <div className="edit-modal-body">{children}</div>
          </>
        )}
      </div>
    </div>
  );
}
