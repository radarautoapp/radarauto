/**
 * StoreTab
 *
 * Aba "Loja" da Configuração. Só renderiza se user é lojista com storeId.
 *
 * Estrutura:
 *  - Card "Identidade" (read-only): CNPJ, Razão social, Nome fantasia da Receita, Cidade/UF
 *  - Card "Dados de contato" (editáveis): Nome de exibição, telefone, whatsapp, email, descrição
 */
"use client";

import {
  AlertCircle,
  AtSign,
  Building2,
  FileText,
  MapPin,
  Phone,
  Shield,
  Store as StoreIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { PublicStore } from "@radar/types";
import { Skeleton } from "@radar/ui";
import { WhatsAppIcon } from "@radar/ui";

import { toFriendlyError } from "@/lib/error-messages";
import { storesApi } from "@/lib/stores-api";

import { LogoCard } from "./LogoCard";
import { EditStoreDescriptionModal } from "./EditStoreDescriptionModal";
import { EditStoreEmailModal } from "./EditStoreEmailModal";
import { EditStoreNameModal } from "./EditStoreNameModal";
import { EditStorePhoneModal } from "./EditStorePhoneModal";
import { FieldRow } from "./FieldRow";

type EditingField = null | "name" | "phone" | "whatsapp" | "email" | "description";

function maskPhone(raw: string | null): string {
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return "—";
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function maskCnpj(cnpj: string): string {
  const c = cnpj.replace(/\D/g, "");
  if (c.length !== 14) return cnpj;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}

function truncate(s: string | null, max = 80): string {
  if (!s) return "—";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export function StoreTab(): JSX.Element {
  const [store, setStore] = useState<PublicStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingField>(null);

  const load = useCallback(async (opts?: { silent?: boolean }): Promise<void> => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const res = await storesApi.getMine();
      setStore(res.store);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="cfg-content-full">
        <section className="cfg-card">
          <header className="cfg-card-head">
            <Skeleton width="40%" height="22px" />
          </header>
          <div
            style={{ padding: "0 24px 20px", display: "flex", flexDirection: "column", gap: 10 }}
          >
            <Skeleton height="60px" />
            <Skeleton height="60px" />
            <Skeleton height="60px" />
          </div>
        </section>
      </div>
    );
  }

  if (error && !store) {
    return (
      <div className="auth-error" role="alert" style={{ margin: 0 }}>
        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>{error}</span>
      </div>
    );
  }

  if (!store) return <div />;

  return (
    <>
      <LogoCard store={store} onUpdated={() => void load({ silent: true })} />
      <section className="cfg-card">
        <header className="cfg-card-head">
          <h2 className="cfg-card-title">Dados oficiais</h2>
          <p className="cfg-card-sub">Vindos da Receita Federal. Não editáveis.</p>
        </header>
        <div className="field-list">
          <FieldRow
            icon={Shield}
            label="CNPJ"
            value={maskCnpj(store.cnpj)}
            hint="Vem da Receita."
          />
          {store.legalName && (
            <FieldRow
              icon={Building2}
              label="Razão social"
              value={store.legalName}
              hint="Vem da Receita."
            />
          )}
          {store.tradeName && (
            <FieldRow
              icon={StoreIcon}
              label="Nome fantasia (Receita)"
              value={store.tradeName}
              hint="Vem da Receita."
            />
          )}
          <FieldRow
            icon={MapPin}
            label="Cidade / UF"
            value={`${store.city} · ${store.state}`}
            hint="Vem da Receita."
          />
        </div>
      </section>

      <section className="cfg-card">
        <header className="cfg-card-head">
          <h2 className="cfg-card-title">Dados da loja</h2>
          <p className="cfg-card-sub">Nome, contato e descrição que aparecem pros clientes.</p>
        </header>
        <div className="field-list">
          <FieldRow
            icon={StoreIcon}
            label="Nome de exibição"
            value={store.name}
            onEdit={() => setEditing("name")}
          />
          <FieldRow
            icon={Phone}
            label="Telefone comercial"
            value={maskPhone(store.phone)}
            onEdit={() => setEditing("phone")}
          />
          <FieldRow
            icon={WhatsAppIcon}
            label="WhatsApp comercial"
            value={maskPhone(store.whatsapp)}
            onEdit={() => setEditing("whatsapp")}
          />
          <FieldRow
            icon={AtSign}
            label="Email comercial"
            value={store.email ?? "—"}
            onEdit={() => setEditing("email")}
          />
          <FieldRow
            icon={FileText}
            label="Descrição"
            value={truncate(store.description)}
            onEdit={() => setEditing("description")}
          />
        </div>
      </section>

      <EditStoreNameModal
        open={editing === "name"}
        currentName={store.name}
        onClose={() => setEditing(null)}
        onUpdated={() => void load({ silent: true })}
      />
      <EditStorePhoneModal
        open={editing === "phone"}
        kind="phone"
        currentValue={store.phone}
        onClose={() => setEditing(null)}
        onUpdated={() => void load({ silent: true })}
      />
      <EditStorePhoneModal
        open={editing === "whatsapp"}
        kind="whatsapp"
        currentValue={store.whatsapp}
        onClose={() => setEditing(null)}
        onUpdated={() => void load({ silent: true })}
      />
      <EditStoreEmailModal
        open={editing === "email"}
        currentEmail={store.email}
        onClose={() => setEditing(null)}
        onUpdated={() => void load({ silent: true })}
      />
      <EditStoreDescriptionModal
        open={editing === "description"}
        currentDescription={store.description}
        onClose={() => setEditing(null)}
        onUpdated={() => void load({ silent: true })}
      />
    </>
  );
}
