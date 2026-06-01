/**
 * Topbar
 *
 * Barra superior do shell autenticado. Fase 2: versão mínima
 * (título + subtítulo + user menu). Vai crescer nas próximas fases
 * com busca, notificações, plan toggle.
 *
 * Matching .top do protótipo: fundo primary, sticky, shadow.
 */
"use client";

import { Menu } from "lucide-react";
import type { ComponentType } from "react";

export interface TopbarUser {
  name: string;
  initials: string;
  roleLabel: string;
  roleIcon?: ComponentType<{ size?: number; color?: string }>;
}

export interface TopbarProps {
  title: string;
  subtitle?: string;
  user: TopbarUser;
  onLogout: () => void;
  onOpenSidebar?: () => void;
  onGoSettings?: () => void;
}

export function Topbar({
  title,
  subtitle,
  user,
  onLogout,
  onOpenSidebar,
  onGoSettings,
}: TopbarProps): JSX.Element {
  return (
    <div className="top">
      {onOpenSidebar && (
        <button
          type="button"
          className="icon-btn show-sm"
          aria-label="Abrir menu"
          onClick={onOpenSidebar}
        >
          <Menu size={18} />
        </button>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 className="display">{title}</h1>
        {subtitle && (
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
