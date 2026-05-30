/**
 * /app/leads — Leads gerados pelos anúncios da loja.
 *
 * Placeholder até a Fase 5 (Leads + Radar).
 */
"use client";

import { Users } from "lucide-react";

import { EmptyState } from "@radar/ui";

export default function LeadsPage(): JSX.Element {
  return (
    <div className="page-wrap">
      <header className="page-head">
        <h1 className="page-title">Leads</h1>
        <p className="page-sub">Interessados nos seus veículos com score automático.</p>
      </header>
      <EmptyState
        icon={Users}
        title="Sem leads ainda"
        description="Quando alguém visualizar, favoritar ou tocar pra falar com você num anúncio, vai aparecer aqui com o score (Cold, Warm, Hot)."
      />
    </div>
  );
}
