/**
 * /app/configuracao — Perfil + Loja (lojista) + Sessões.
 *
 * Aba "Loja" condicional: só aparece pra user.role === 'lojista' com storeId.
 */
"use client";

export const dynamic = "force-dynamic";

import {
  Lock,
  Mail,
  Monitor,
  Phone,
  Settings as SettingsIcon,
  Shield,
  Store as StoreIcon,
  User as UserIcon,
} from "lucide-react";
import { useState } from "react";

import { WhatsAppIcon } from "@radar/ui";

import { useAuthStore } from "@/stores/auth.store";

import { EditNameModal } from "./_components/EditNameModal";
import { EditPasswordModal } from "./_components/EditPasswordModal";
import { EditPhoneModal } from "./_components/EditPhoneModal";
import { FieldRow } from "./_components/FieldRow";
import { SessionsTab } from "./_components/SessionsTab";
import { StoreTab } from "./_components/StoreTab";

type Tab = "perfil" | "loja" | "sessoes";
type EditingField = null | "name" | "phone" | "password";

function maskPhone(raw: string): string {
  const digits = (raw ?? "").replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "—";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function maskCpfPii(cpf: string | null): string {
  if (!cpf) return "—";
  const c = cpf.replace(/\D/g, "");
  if (c.length !== 11) return cpf;
  return `${c.slice(0, 3)}.***.***-${c.slice(9)}`;
}

export default function ConfiguracaoPage(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>("perfil");
  const [editing, setEditing] = useState<EditingField>(null);

  if (!user) return <div />;

  const canManageStore = user.role === "lojista" && !!user.storeId;

  return (
    <div className="page-wrap">
      <div className="cfg-tabs">
        <button
          type="button"
          className={`cfg-tab${tab === "perfil" ? " active" : ""}`}
          onClick={() => setTab("perfil")}
        >
          <UserIcon size={16} />
          Perfil
        </button>
        {canManageStore && (
          <button
            type="button"
            className={`cfg-tab${tab === "loja" ? " active" : ""}`}
            onClick={() => setTab("loja")}
          >
            <StoreIcon size={16} />
            Loja
          </button>
        )}
        <button
          type="button"
          className={`cfg-tab${tab === "sessoes" ? " active" : ""}`}
          onClick={() => setTab("sessoes")}
        >
          <Monitor size={16} />
          Sessões
        </button>
      </div>

      <div className="cfg-content-full">
        {tab === "perfil" && (
          <>
            <section className="cfg-card">
              <header className="cfg-card-head">
                <h2 className="cfg-card-title">Dados pessoais</h2>
                <p className="cfg-card-sub">Toque em um campo pra editar.</p>
              </header>
              <div className="field-list">
                <FieldRow
                  icon={UserIcon}
                  label="Nome"
                  value={user.name}
                  onEdit={() => setEditing("name")}
                />
                <FieldRow
                  icon={WhatsAppIcon}
                  label="WhatsApp"
                  value={maskPhone(user.phone)}
                  onEdit={() => setEditing("phone")}
                />
                <FieldRow icon={Mail} label="Email" value={user.email} hint="Não editável." />
                <FieldRow
                  icon={Shield}
                  label="CPF"
                  value={maskCpfPii(user.cpf)}
                  hint="Não editável."
                />
              </div>
            </section>

            <section className="cfg-card">
              <header className="cfg-card-head">
                <h2 className="cfg-card-title">Segurança</h2>
                <p className="cfg-card-sub">Senha e dispositivos conectados.</p>
              </header>
              <div className="field-list">
                <FieldRow
                  icon={Lock}
                  label="Senha"
                  value="••••••••"
                  onEdit={() => setEditing("password")}
                />
              </div>
            </section>
          </>
        )}

        {tab === "loja" && canManageStore && <StoreTab />}
        {tab === "sessoes" && <SessionsTab />}
      </div>

      <EditNameModal
        open={editing === "name"}
        currentName={user.name}
        onClose={() => setEditing(null)}
      />
      <EditPhoneModal
        open={editing === "phone"}
        currentPhone={user.phone}
        onClose={() => setEditing(null)}
      />
      <EditPasswordModal open={editing === "password"} onClose={() => setEditing(null)} />
    </div>
  );
}
