/**
 * SessionsTab
 *
 * Conteúdo da aba "Sessões" na página de Configuração.
 *
 * Carrega lista de sessões ativas, permite revogar 1 ou todas as outras.
 */
"use client";

import { AlertCircle, ShieldOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { PublicSession } from "@radar/types";
import { Button, Skeleton } from "@radar/ui";

import { toFriendlyError } from "@/lib/error-messages";
import { sessionsApi } from "@/lib/sessions-api";

import { ConfirmModal } from "./ConfirmModal";
import { SessionCard } from "./SessionCard";

type ConfirmState = { kind: "one"; sessionId: string } | { kind: "others" } | null;

export function SessionsTab(): JSX.Element {
  const [sessions, setSessions] = useState<PublicSession[] | null>(null);
  const [currentId, setCurrentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await sessionsApi.list();
      setSessions(res.sessions);
      setCurrentId(res.currentSessionId);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRevokeOne = async (sessionId: string): Promise<void> => {
    setActing(true);
    try {
      await sessionsApi.revoke(sessionId);
      setConfirm(null);
      await load();
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setActing(false);
    }
  };

  const onRevokeOthers = async (): Promise<void> => {
    setActing(true);
    try {
      await sessionsApi.revokeOthers();
      setConfirm(null);
      await load();
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setActing(false);
    }
  };

  const otherSessionsCount = sessions ? sessions.filter((s) => !s.isCurrent).length : 0;

  return (
    <section className="cfg-card">
      <header className="cfg-card-head" style={{ padding: "20px 24px" }}>
        <h2 className="cfg-card-title">Dispositivos conectados</h2>
        <p className="cfg-card-sub">
          Você pode acessar a conta em vários dispositivos. Revogue qualquer um se notar algo
          suspeito.
        </p>
      </header>

      {loading && (
        <div style={{ padding: "0 24px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <Skeleton height="70px" />
          <Skeleton height="70px" />
        </div>
      )}

      {error && !loading && (
        <div className="auth-error" role="alert" style={{ margin: "0 24px 16px" }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {!loading && sessions && sessions.length > 0 && (
        <div className="session-list">
          {sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              onRevoke={() => setConfirm({ kind: "one", sessionId: s.id })}
              busy={acting}
            />
          ))}
        </div>
      )}

      {!loading && otherSessionsCount > 0 && (
        <div className="session-foot">
          <Button
            variant="ghost"
            icon={ShieldOff}
            onClick={() => setConfirm({ kind: "others" })}
            disabled={acting}
          >
            Sair de todos os outros dispositivos ({otherSessionsCount})
          </Button>
        </div>
      )}

      <ConfirmModal
        open={confirm?.kind === "one"}
        title="Revogar este dispositivo?"
        description="O dispositivo será desconectado e precisará fazer login de novo."
        confirmLabel="Revogar"
        variant="danger"
        loading={acting}
        onConfirm={() => {
          if (confirm?.kind === "one") void onRevokeOne(confirm.sessionId);
        }}
        onClose={() => setConfirm(null)}
      />

      <ConfirmModal
        open={confirm?.kind === "others"}
        title="Sair de todos os outros dispositivos?"
        description={`Vamos desconectar ${otherSessionsCount} sessão(ões). Este dispositivo continua conectado.`}
        confirmLabel="Sair de todos"
        variant="danger"
        loading={acting}
        onConfirm={() => {
          void onRevokeOthers();
        }}
        onClose={() => setConfirm(null)}
      />
    </section>
  );
}
