/**
 * /app/meus-veiculos — Veículos da loja do usuário logado.
 *
 * Lojista e funcionário veem todos os veículos da loja. O lojista pode
 * aprovar inline os que estão PENDING (cadastrados por funcionários).
 */
"use client";

export const dynamic = "force-dynamic";

import { AlertCircle, Car, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { VehicleListItem } from "@radar/types";
import { Button, ConfirmModal, EmptyState, Skeleton } from "@radar/ui";

import { toFriendlyError } from "@/lib/error-messages";
import { useAuthStore } from "@/stores/auth.store";

import { vehiclesApi } from "../cadastrar-veiculo/_wizard/vehicles-api";
import { VehicleCard } from "./_components/VehicleCard";

type StatusFilter = "all" | "ACTIVE" | "PENDING" | "SOLD";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "ACTIVE", label: "Ativos" },
  { key: "PENDING", label: "Aguardando aprovação" },
  { key: "SOLD", label: "Vendidos" },
];

export default function MeusVeiculosPage(): JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const canApprove = user?.role === "lojista" || user?.role === "admin";

  const [vehicles, setVehicles] = useState<VehicleListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleListItem | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }): Promise<void> => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const res = await vehiclesApi.list();
      setVehicles(res.vehicles);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onApprove = async (id: string): Promise<void> => {
    setApprovingId(id);
    try {
      await vehiclesApi.approve(id);
      await load({ silent: true });
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setApprovingId(null);
    }
  };

  const onEdit = (id: string): void => {
    router.push(`/app/cadastrar-veiculo?id=${id}`);
  };

  const onTogglePause = async (v: VehicleListItem): Promise<void> => {
    setBusyId(v.id);
    setError(null);
    try {
      const action = v.status === "ACTIVE" ? "pause" : "activate";
      await vehiclesApi.setStatus(v.id, action);
      await load({ silent: true });
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  const onToggleSold = async (v: VehicleListItem): Promise<void> => {
    setBusyId(v.id);
    setError(null);
    try {
      const action = v.status === "SOLD" ? "unsell" : "sell";
      await vehiclesApi.setStatus(v.id, action);
      await load({ silent: true });
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  const onConfirmDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setBusyId(id);
    setDeleteTarget(null);
    setError(null);
    try {
      await vehiclesApi.remove(id);
      await load({ silent: true });
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  const filtered = vehicles?.filter((v) => (filter === "all" ? true : v.status === filter)) ?? [];

  // Contagem por filtro: "all" = total; demais = veículos naquele status.
  const countFor = (key: StatusFilter): number => {
    if (!vehicles) return 0;
    if (key === "all") return vehicles.length;
    return vehicles.filter((v) => v.status === key).length;
  };

  return (
    <div className="page-wrap">
      <header className="vlist-header vlist-header-end">
        <Button variant="primary" icon={Plus} onClick={() => router.push("/app/cadastrar-veiculo")}>
          Cadastrar veículo
        </Button>
      </header>

      {/* Filtros */}
      {!loading && vehicles && vehicles.length > 0 && (
        <div className="vlist-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`vlist-filter${filter === f.key ? " on" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label} ({countFor(f.key)})
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="vlist-grid">
          <Skeleton height="320px" />
          <Skeleton height="320px" />
          <Skeleton height="320px" />
        </div>
      )}

      {!loading && error && (
        <div className="auth-error" role="alert">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && vehicles && vehicles.length === 0 && (
        <EmptyState
          icon={Car}
          title="Você ainda não tem veículos cadastrados"
          description="Cadastre seu primeiro veículo com fotos, ficha técnica e preço. Ele aparece aqui pra você gerenciar."
          action={
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => router.push("/app/cadastrar-veiculo")}
            >
              Cadastrar veículo
            </Button>
          }
        />
      )}

      {!loading && !error && vehicles && vehicles.length > 0 && (
        <>
          {filtered.length === 0 ? (
            <div className="vlist-empty-filter muted">Nenhum veículo nesse filtro.</div>
          ) : (
            <div className="vlist-grid">
              {filtered.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  canApprove={canApprove}
                  approving={approvingId === v.id}
                  busy={busyId === v.id}
                  onApprove={() => void onApprove(v.id)}
                  onEdit={() => onEdit(v.id)}
                  onTogglePause={() => void onTogglePause(v)}
                  onToggleSold={() => void onToggleSold(v)}
                  onDelete={() => setDeleteTarget(v)}
                />
              ))}
            </div>
          )}
        </>
      )}
      <ConfirmModal
        open={!!deleteTarget}
        title="Excluir veículo?"
        description={
          deleteTarget
            ? `"${deleteTarget.brand} ${deleteTarget.model}" será removido dos seus anúncios. Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        icon={Trash2}
        onConfirm={() => void onConfirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
