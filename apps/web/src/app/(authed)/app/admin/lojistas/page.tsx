/**
 * /app/admin — [ADMIN] Lista de lojistas cadastrados.
 *
 * Permite aprovar/revogar a permissao de venda de cada loja (Toggle).
 * Busca por nome (loja ou lojista). Sem paginacao (MVP).
 */
"use client";

export const dynamic = "force-dynamic";

import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { AdminStoreItem } from "@radar/types";
import { Avatar, EmptyState, Input, Skeleton, Toggle } from "@radar/ui";

import { toFriendlyError } from "@/lib/error-messages";
import { initialsFromName } from "@/lib/nav-config";
import { storesApi } from "@/lib/stores-api";
import { useAuthStore } from "@/stores/auth.store";

import "./lojistas.css";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatCnpj(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 14) return raw;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export default function AdminStoresPage(): JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [stores, setStores] = useState<AdminStoreItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await storesApi.listAllForAdmin();
      setStores(res.stores);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/app");
      return;
    }
    if (user) void load();
  }, [user, router, load]);

  const filtered = useMemo(() => {
    if (!stores) return [];
    const q = query.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.ownerName ?? "").toLowerCase().includes(q),
    );
  }, [stores, query]);

  const toggle = async (store: AdminStoreItem): Promise<void> => {
    if (togglingId) return;
    setTogglingId(store.id);
    const nextApproved = store.sellingStatus !== "APPROVED";
    try {
      await storesApi.setSellingStatus(store.id, nextApproved);
      setStores((prev) =>
        prev
          ? prev.map((s) =>
              s.id === store.id ? { ...s, sellingStatus: nextApproved ? "APPROVED" : "NONE" } : s,
            )
          : prev,
      );
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setTogglingId(null);
    }
  };

  if (!user || user.role !== "admin") {
    return <div className="page-wrap" />;
  }

  return (
    <div className="page-wrap lojistas-page">
      <div className="admin-search-wrap">
        <Input
          type="text"
          placeholder="Buscar por nome da loja ou do lojista..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="auth-error" role="alert" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="admin-stores-list">
          <Skeleton height="74px" />
          <Skeleton height="74px" />
          <Skeleton height="74px" />
        </div>
      )}

      {!loading && stores && stores.length === 0 && (
        <EmptyState
          title="Nenhuma loja cadastrada"
          description="Ainda não há lojistas no RadarAuto."
        />
      )}

      {!loading && stores && stores.length > 0 && filtered.length === 0 && (
        <EmptyState title="Nenhuma loja encontrada" description={`Nada bate com "${query}".`} />
      )}

      {!loading && filtered.length > 0 && (
        <div className="admin-stores-list">
          {filtered.map((store) => (
            <div key={store.id} className="store-card">
              <Avatar
                initials={initialsFromName(store.name)}
                imageUrl={store.logoUrl}
                size="md"
                alt={store.name}
              />
              <div className="store-card-info">
                <div className="store-card-name">
                  {store.name}{" "}
                  <span className="store-card-city">
                    · {store.city}/{store.state}
                  </span>
                </div>
                <div className="store-card-meta">
                  {formatCnpj(store.cnpj)} · Cadastrada em {formatDate(store.createdAt)}
                </div>
                <div className="store-card-owner">
                  {store.ownerName ?? "—"}
                  {store.ownerEmail ? ` · ${store.ownerEmail}` : ""}
                </div>
              </div>
              <div className="store-card-toggle">
                <span className="store-card-toggle-label">Vende</span>
                <Toggle
                  on={store.sellingStatus === "APPROVED"}
                  onClick={() => void toggle(store)}
                  ariaLabel={`Permitir ${store.name} vender`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
