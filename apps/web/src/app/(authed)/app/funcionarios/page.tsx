/**
 * /app/funcionarios — Funcionários da loja.
 *
 * Lojista cadastra funcionários que ajudam a gerenciar veículos e leads.
 * Placeholder até a Fase 3 (Configurações + Funcionários).
 */
"use client";

import { Plus, Users } from "lucide-react";

import { EmptyState } from "@radar/ui";

export default function FuncionariosPage(): JSX.Element {
  return (
    <div className="page-wrap">
      <header className="page-head">
        <h1 className="page-title">Funcionários</h1>
        <p className="page-sub">Convide pessoas pra te ajudar a gerenciar a loja.</p>
      </header>
      <EmptyState
        icon={Users}
        title="Nenhum funcionário cadastrado"
        description="Convide membros da sua equipe pra gerenciar veículos e responder leads."
        cta={{
          label: "Convidar funcionário",
          icon: Plus,
          onClick: () => {
            /* TODO: abrir modal de convite (Fase 3) */
          },
        }}
      />
    </div>
  );
}
