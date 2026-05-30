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

import { ChevronDown, LogOut, Menu, Settings as SettingsIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";

import { Avatar } from "./Avatar";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const RoleIcon = user.roleIcon;

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent): void => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

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

      <div className="usr-wrap" ref={wrapRef}>
        <button type="button" className="usr-btn" onClick={() => setMenuOpen((v) => !v)}>
          <Avatar initials={user.initials} size={30} rounded="full" />
          <span className="usr-name hide-sm">{user.name}</span>
          <ChevronDown size={14} color="rgba(255,255,255,.8)" />
        </button>
        {menuOpen && (
          <div className="usr-pop" onClick={(e) => e.stopPropagation()}>
            <div className="usr-pop-head">
              <Avatar initials={user.initials} size={42} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
                <div className="ra-flex ra-center" style={{ gap: 5, marginTop: 2 }}>
                  {RoleIcon && <RoleIcon size={11} color="var(--muted)" />}
                  <span className="muted" style={{ fontSize: 12 }}>
                    {user.roleLabel}
                  </span>
                </div>
              </div>
            </div>
            {onGoSettings && (
              <button
                type="button"
                className="usr-pop-item"
                onClick={() => {
                  onGoSettings();
                  setMenuOpen(false);
                }}
              >
                <SettingsIcon size={16} color="var(--muted)" />
                Configuração
              </button>
            )}
            <button
              type="button"
              className="usr-pop-item danger"
              onClick={() => {
                onLogout();
                setMenuOpen(false);
              }}
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
