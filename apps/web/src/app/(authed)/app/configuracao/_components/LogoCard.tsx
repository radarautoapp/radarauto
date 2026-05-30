/**
 * LogoCard — card "Logo" no topo da aba Loja.
 *
 * Mostra avatar grande com logo (ou iniciais) + 2 botões: Alterar / Remover.
 */
"use client";

import { Trash2, Upload } from "lucide-react";
import { useState } from "react";

import type { PublicStore } from "@radar/types";
import { Avatar, Button } from "@radar/ui";

import { toFriendlyError } from "@/lib/error-messages";
import { storesApi } from "@/lib/stores-api";

import { ConfirmModal } from "./ConfirmModal";
import { EditLogoModal } from "./EditLogoModal";

export interface LogoCardProps {
  store: PublicStore;
  onUpdated: () => void;
}

export function LogoCard({ store, onUpdated }: LogoCardProps): JSX.Element {
  const [editing, setEditing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Cache buster: força reload da imagem após upload
  const logoUrl = store.logoUrl
    ? `${store.logoUrl}?v=${new Date(store.updatedAt).getTime()}`
    : null;

  const onConfirmRemove = async (): Promise<void> => {
    setRemoveError(null);
    setRemoving(true);
    try {
      await storesApi.removeLogo();
      onUpdated();
      setConfirmRemove(false);
    } catch (err) {
      setRemoveError(toFriendlyError(err));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <section className="cfg-card">
        <header className="cfg-card-head">
          <h2 className="cfg-card-title">Logo</h2>
          <p className="cfg-card-sub">
            Aparece pros clientes no catálogo e na sua página. Quadrado, mínimo 200×200px.
          </p>
        </header>
        <div className="logo-card-body">
          <Avatar
            initials={store.initials}
            imageUrl={logoUrl}
            size="xl"
            alt={`Logo de ${store.name}`}
          />
          <div className="logo-card-actions">
            <Button variant="primary" icon={Upload} onClick={() => setEditing(true)}>
              {store.logoUrl ? "Alterar logo" : "Adicionar logo"}
            </Button>
            {store.logoUrl && (
              <Button
                variant="ghost"
                icon={Trash2}
                onClick={() => {
                  setRemoveError(null);
                  setConfirmRemove(true);
                }}
              >
                Remover
              </Button>
            )}
          </div>
        </div>
      </section>

      <EditLogoModal open={editing} onClose={() => setEditing(false)} onUpdated={onUpdated} />

      <ConfirmModal
        open={confirmRemove}
        title="Remover logo da loja?"
        description="A loja voltará a exibir as iniciais. Você pode adicionar outro logo depois."
        confirmLabel="Remover logo"
        confirmVariant="danger"
        loading={removing}
        error={removeError}
        onConfirm={() => void onConfirmRemove()}
        onCancel={() => setConfirmRemove(false)}
      />
    </>
  );
}
