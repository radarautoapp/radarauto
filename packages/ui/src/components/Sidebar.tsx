/**
 * Sidebar
 *
 * Navegação principal do app autenticado.
 * Itens recebidos via props (não hardcoded — Rule 13).
 *
 * Matching .sb do protótipo: logo gradiente, menu vertical com chevron,
 * footer com avatar/role/logout.
 *
 * Mobile: collapsed por padrão, aparece via overlay (CSS @media).
 */
"use client";

import { ChevronRight, LogOut } from "lucide-react";
import type { ComponentType } from "react";

import { Avatar } from "./Avatar";
import { BrandMark } from "./Brand";

export interface SidebarItem {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}

export interface SidebarUser {
  name: string;
  initials: string;
  roleLabel: string;
  roleIcon?: ComponentType<{ size?: number; color?: string }>;
}

export interface SidebarProps {
  items: SidebarItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  user: SidebarUser;
  onLogout: () => void;
  open?: boolean;
  onLogoClick?: () => void;
}

export function Sidebar({
  items,
  activeId,
  onSelect,
  user,
  onLogout,
  open = false,
  onLogoClick,
}: SidebarProps): JSX.Element {
  const RoleIcon = user.roleIcon;

  return (
    <aside className={`sb${open ? " open" : ""}`}>
      <div
        className="sb-logo"
        onClick={onLogoClick}
        role={onLogoClick ? "button" : undefined}
        tabIndex={onLogoClick ? 0 : undefined}
      >
        <BrandMark size={40} />
        <div className="sb-name">
          Radar<b>Auto</b>
        </div>
      </div>

      <div className="sb-body">
        <div className="sb-sec micro">Menu principal</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {items.map((item) => {
            const isActive = activeId === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-i${isActive ? " active" : ""}`}
                onClick={() => onSelect(item.id)}
              >
                <Icon size={19} strokeWidth={isActive ? 2.4 : 2} />
                {item.label}
                <ChevronRight size={15} className="chev" />
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sb-user">
        <Avatar initials={user.initials} size={38} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
          <div className="ra-flex ra-center" style={{ gap: 6, marginTop: 2 }}>
            {RoleIcon && <RoleIcon size={12} color="var(--muted)" />}
            <span className="muted" style={{ fontSize: 12 }}>
              {user.roleLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="iconbtn-sm"
          title="Sair"
          aria-label="Sair"
          onClick={onLogout}
          style={{ flexShrink: 0 }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
