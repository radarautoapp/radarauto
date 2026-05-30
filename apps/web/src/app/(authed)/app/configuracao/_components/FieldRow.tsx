/**
 * FieldRow
 *
 * Linha de dado read-only com label, valor e (opcional) ícone de edição.
 * Quando tem onEdit, vira um botão clicável que leva à página de edição.
 */
"use client";

import { ChevronRight, Pencil } from "lucide-react";
import type { ComponentType } from "react";

export interface FieldRowProps {
  icon?: ComponentType<{ size?: number }>;
  label: string;
  value: string;
  hint?: string;
  onEdit?: () => void;
}

export function FieldRow({ icon: Icon, label, value, hint, onEdit }: FieldRowProps): JSX.Element {
  const content = (
    <>
      <div className="field-row-main">
        <div className="field-row-label">
          {Icon && <Icon size={13} />}
          {label}
        </div>
        <div className="field-row-value">{value}</div>
        {hint && !onEdit && <div className="field-row-hint">{hint}</div>}
      </div>
      {onEdit && (
        <div className="field-row-edit" aria-hidden="true">
          <Pencil size={15} />
          <ChevronRight size={16} />
        </div>
      )}
    </>
  );

  if (onEdit) {
    return (
      <button type="button" className="field-row interactive" onClick={onEdit}>
        {content}
      </button>
    );
  }
  return <div className="field-row">{content}</div>;
}
