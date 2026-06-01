/**
 * ConfirmModal
 *
 * Modal genérico de confirmação: título, descrição, botão de confirmar e
 * cancelar. Suporta variante "danger" (ações destrutivas como sair/excluir).
 * Backdrop com blur, fecha no Escape, confirma no Enter.
 */
"use client";

import { useEffect } from "react";
import type { ComponentType, ReactNode } from "react";

import { Button } from "./Button";

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  icon?: ComponentType<{ size?: number }>;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "primary",
  icon: Icon,
  onConfirm,
  onCancel,
}: ConfirmModalProps): JSX.Element | null {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        {Icon && (
          <div className={`confirm-icon confirm-icon-${variant}`}>
            <Icon size={24} />
          </div>
        )}
        <h2 className="confirm-title">{title}</h2>
        {description && <p className="confirm-desc">{description}</p>}
        <div className="confirm-actions">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant === "danger" ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
