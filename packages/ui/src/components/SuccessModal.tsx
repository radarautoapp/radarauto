/**
 * SuccessModal
 *
 * Modal centralizado de sucesso. Check verde animado, título, descrição
 * e CTA. Bloqueia interação no fundo (backdrop com blur).
 *
 * Reutilizável: cadastro, criação de veículo, aprovação de anúncio, etc.
 */
"use client";

import { Check } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { Button } from "./Button";

export interface SuccessModalProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  ctaLabel: string;
  onCta: () => void;
  onClose?: () => void;
}

export function SuccessModal({
  open,
  title,
  description,
  ctaLabel,
  onCta,
  onClose,
}: SuccessModalProps): JSX.Element | null {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Enter") onCta();
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onCta, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
      onClick={onClose}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-check">
          <Check size={36} strokeWidth={3} />
        </div>
        <div id="success-modal-title" className="modal-title">
          {title}
        </div>
        {description && <div className="modal-desc">{description}</div>}
        <Button variant="primary" block onClick={onCta} autoFocus>
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
