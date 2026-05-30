/**
 * EmployeeCard
 *
 * Card de funcionário com:
 *  - Avatar (iniciais)
 *  - Nome (ou email pra PENDING) + email secundário (pra ACTIVE)
 *  - Badge tonalizada por status (warning amarelo / success verde)
 *  - Botões de ação visíveis com tooltip (Reenviar / Cancelar / Remover)
 */
"use client";

import { Send, Trash2, X } from "lucide-react";

import type { Employee } from "@radar/types";
import { Avatar, Badge } from "@radar/ui";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "agora há pouco";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min atrás`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h atrás`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d atrás`;
  const mon = Math.floor(day / 30);
  return `${mon} mês${mon > 1 ? "es" : ""} atrás`;
}

function initialsFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return ((words[0]![0] ?? "") + (words[1]![0] ?? "")).toUpperCase();
}

export interface EmployeeCardProps {
  employee: Employee;
  onResend: () => void;
  onRemove: () => void;
}

export function EmployeeCard({ employee, onResend, onRemove }: EmployeeCardProps): JSX.Element {
  const isPending = employee.status === "PENDING_ACTIVATION";
  const displayName = isPending ? employee.email : employee.name;
  const initials = isPending
    ? employee.email.slice(0, 2).toUpperCase()
    : initialsFromName(employee.name);

  return (
    <div className="employee-card">
      <Avatar initials={initials} size="md" />

      <div className="employee-card-body">
        <div className="employee-card-name">{displayName}</div>
        <div className="employee-card-meta">
          {isPending ? (
            <>
              <Badge tone="warning">Aguardando ativação</Badge>
              <span>Convidado {relativeTime(employee.createdAt)}</span>
            </>
          ) : (
            <>
              <Badge tone="success">Ativo</Badge>
              <span>Entrou {relativeTime(employee.createdAt)}</span>
            </>
          )}
        </div>
        {!isPending && <div className="employee-card-email">{employee.email}</div>}
      </div>

      <div className="employee-card-actions">
        {isPending && (
          <>
            <button
              type="button"
              className="action-btn action-btn-primary"
              aria-label="Reenviar convite"
              title="Reenviar convite"
              onClick={onResend}
            >
              <Send size={16} />
            </button>
            <button
              type="button"
              className="action-btn action-btn-danger"
              aria-label="Cancelar convite"
              title="Cancelar convite"
              onClick={onRemove}
            >
              <X size={18} />
            </button>
          </>
        )}
        {!isPending && (
          <button
            type="button"
            className="action-btn action-btn-danger"
            aria-label="Remover funcionário"
            title="Remover funcionário"
            onClick={onRemove}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
