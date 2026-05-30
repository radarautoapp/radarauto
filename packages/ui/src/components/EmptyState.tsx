/**
 * EmptyState
 *
 * Renderiza um placeholder visual quando uma lista/área não tem dados.
 * Usado em listas vazias, dashboards iniciais, telas sem resultados.
 *
 * Props:
 *   - icon: ComponentType (do lucide-react ou similar)
 *   - title: título principal (1 linha)
 *   - description?: subtítulo opcional
 *   - cta?: { label, onClick, icon? } — call-to-action opcional
 *   - secondary?: { label, onClick } — ação secundária
 *
 * Visual: ícone circular grande no topo, texto centrado, ação(ões) embaixo.
 */
"use client";

import type { ComponentType } from "react";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: ComponentType<{ size?: number }>;
}

export interface EmptyStateProps {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  description?: string;
  cta?: EmptyStateAction;
  secondary?: EmptyStateAction;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  secondary,
}: EmptyStateProps): JSX.Element {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state-icon">
        <Icon size={32} strokeWidth={1.6} />
      </div>
      <h2 className="empty-state-title">{title}</h2>
      {description && <p className="empty-state-desc">{description}</p>}
      {(cta || secondary) && (
        <div className="empty-state-actions">
          {cta && (
            <button type="button" className="empty-state-cta" onClick={cta.onClick}>
              {cta.icon && <cta.icon size={16} />}
              {cta.label}
            </button>
          )}
          {secondary && (
            <button type="button" className="empty-state-secondary" onClick={secondary.onClick}>
              {secondary.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
