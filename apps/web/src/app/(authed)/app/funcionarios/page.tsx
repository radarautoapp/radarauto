/**
 * /app/funcionarios — gestão de funcionários da loja.
 *
 * Lista todos com badge de status (Aguardando ativação / Ativo).
 * Ações por card: Reenviar / Cancelar (PENDING) ou Remover (ACTIVE).
 */
"use client";

import { AlertCircle, Mail, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { Employee } from "@radar/types";
import { Badge, Button, EmptyState, Skeleton } from "@radar/ui";

import { toFriendlyError } from "@/lib/error-messages";
import { employeesApi } from "@/lib/employees-api";
import { useAuthStore } from "@/stores/auth.store";

import { ConfirmModal } from "../configuracao/_components/ConfirmModal";
import { EmployeeCard } from "./_components/EmployeeCard";
import { InviteEmployeeModal } from "./_components/InviteEmployeeModal";

type RemoveAction = { kind: "remove" | "cancel"; employee: Employee } | null;

export default function FuncionariosPage(): JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [remove, setRemove] = useState<RemoveAction>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }): Promise<void> => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const res = await employeesApi.list();
      setEmployees(res.employees);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Apenas lojista acessa
    if (user && user.role !== "lojista") {
      router.replace("/app");
      return;
    }
    void load();
  }, [user, router, load]);

  const onConfirmRemove = async (): Promise<void> => {
    if (!remove) return;
    setRemoveError(null);
    setRemoving(true);
    try {
      await employeesApi.remove(remove.employee.id);
      setRemove(null);
      void load({ silent: true });
    } catch (err) {
      setRemoveError(toFriendlyError(err));
    } finally {
      setRemoving(false);
    }
  };

  if (user && user.role !== "lojista") return <div />;

  return (
    <div className="page-wrap">
      <header className="employees-header">
        <Button variant="primary" icon={UserPlus} onClick={() => setInviteOpen(true)}>
          Convidar funcionário
        </Button>
      </header>

      {loading && (
        <div className="employees-list">
          <Skeleton height="92px" />
          <Skeleton height="92px" />
          <Skeleton height="92px" />
        </div>
      )}

      {!loading && error && (
        <div className="auth-error" role="alert">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && employees && employees.length === 0 && (
        <EmptyState
          icon={Mail}
          title="Nenhum funcionário ainda"
          description="Convide pessoas pra fazer parte da sua loja. Elas vão receber um email com link pra criar a senha e ativar a conta."
          action={
            <Button variant="primary" icon={UserPlus} onClick={() => setInviteOpen(true)}>
              Convidar funcionário
            </Button>
          }
        />
      )}

      {!loading && employees && employees.length > 0 && (
        <div className="employees-list">
          {employees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onResend={async () => {
                try {
                  await employeesApi.resend(emp.id);
                  void load({ silent: true });
                } catch (err) {
                  setError(toFriendlyError(err));
                }
              }}
              onRemove={() => {
                setRemoveError(null);
                setRemove({
                  kind: emp.status === "PENDING_ACTIVATION" ? "cancel" : "remove",
                  employee: emp,
                });
              }}
            />
          ))}
        </div>
      )}

      <InviteEmployeeModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={() => void load({ silent: true })}
      />

      <ConfirmModal
        open={remove !== null}
        title={
          remove?.kind === "cancel"
            ? "Cancelar convite?"
            : `Remover ${remove?.employee.name ?? "funcionário"}?`
        }
        description={
          remove?.kind === "cancel"
            ? "O convite será invalidado. Você pode convidar essa pessoa novamente depois."
            : "O funcionário perderá acesso imediato. Sessões ativas serão encerradas. Essa ação não pode ser desfeita."
        }
        confirmLabel={remove?.kind === "cancel" ? "Cancelar convite" : "Remover funcionário"}
        confirmVariant="danger"
        loading={removing}
        error={removeError}
        onConfirm={() => void onConfirmRemove()}
        onCancel={() => setRemove(null)}
      />
    </div>
  );
}
