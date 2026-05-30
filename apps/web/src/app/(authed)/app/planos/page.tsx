/**
 * /app/planos — Comparativo Free vs Premium.
 *
 * Placeholder até a Fase 6 (Billing Stripe).
 */
"use client";

import { Crown } from "lucide-react";

import { EmptyState } from "@radar/ui";

export default function PlanosPage(): JSX.Element {
  return (
    <div className="page-wrap">
      <header className="page-head">
        <h1 className="page-title">Planos</h1>
        <p className="page-sub">Desbloqueie recursos avançados com o plano Premium.</p>
      </header>
      <EmptyState
        icon={Crown}
        title="Planos em breve"
        description="Estamos finalizando a integração de pagamento. Em breve você poderá assinar Premium e desbloquear contato direto com leads, analytics e prioridade no feed."
      />
    </div>
  );
}
