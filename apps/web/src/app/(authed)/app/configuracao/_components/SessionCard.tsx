/**
 * SessionCard
 *
 * Card visual de uma sessão ativa.
 * Mostra: ícone do device + browser/OS + IP + última atividade + ações.
 */
"use client";

import { Laptop, LogOut, Smartphone, Tablet } from "lucide-react";

import type { PublicSession } from "@radar/types";

import { parseUserAgent, relativeTime } from "@/lib/session-helpers";

export interface SessionCardProps {
  session: PublicSession;
  onRevoke?: () => void;
  busy?: boolean;
}

export function SessionCard({ session, onRevoke, busy }: SessionCardProps): JSX.Element {
  const ua = parseUserAgent(session.userAgent);
  const Icon =
    ua.deviceType === "mobile" ? Smartphone : ua.deviceType === "tablet" ? Tablet : Laptop;

  return (
    <div className={`session-card${session.isCurrent ? " current" : ""}`}>
      <div className="session-card-ic">
        <Icon size={22} />
      </div>
      <div className="session-card-main">
        <div className="session-card-title-row">
          <h3 className="session-card-title">
            {ua.browser} <span className="session-card-on">em</span> {ua.os}
          </h3>
          {session.isCurrent && <span className="session-card-badge">Este dispositivo</span>}
        </div>
        <div className="session-card-meta">
          <span>{session.ipAddress ?? "IP desconhecido"}</span>
          <span className="session-card-sep">·</span>
          <span>{relativeTime(session.lastSeenAt)}</span>
        </div>
      </div>
      {!session.isCurrent && onRevoke && (
        <button
          type="button"
          className="session-card-revoke"
          onClick={onRevoke}
          disabled={busy}
          aria-label="Revogar sessão"
        >
          <LogOut size={15} />
          <span>Revogar</span>
        </button>
      )}
    </div>
  );
}
