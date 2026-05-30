/**
 * /app/catalogo — Catálogo público de veículos.
 *
 * Placeholder até a Fase 4 (Catálogo + Veículos).
 */
"use client";

import { Car, Search } from "lucide-react";

import { EmptyState } from "@radar/ui";

export default function CatalogoPage(): JSX.Element {
  return (
    <div className="page-wrap">
      <header className="page-head">
        <h1 className="page-title">Catálogo</h1>
        <p className="page-sub">Encontre veículos de lojas verificadas em todo o Brasil.</p>
      </header>
      <EmptyState
        icon={Search}
        title="Catálogo em construção"
        description="O catálogo público está sendo construído. Em breve você vai conseguir buscar veículos por marca, modelo, ano e mais."
      />
    </div>
  );
}
