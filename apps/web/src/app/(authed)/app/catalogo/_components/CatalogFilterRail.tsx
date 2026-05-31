/**
 * CatalogFilterRail — painel lateral de filtros do catálogo.
 *
 * Filtros completos: marca, categoria, preço (R$), ano, km máximo,
 * combustível, cor (swatches), delivery, opcionais e "só oportunidades".
 * Alimentado pelas facetas vindas do backend. Vira drawer no mobile.
 */
"use client";

import { Flame, Truck, X } from "lucide-react";

import type { CatalogFilters, CatalogResponse } from "@radar/types";

/** Estado de filtros em string para os inputs (preço/ano/km como texto). */
export interface FilterFormState {
  brand: string;
  category: string;
  city: string;
  fuel: string;
  color: string;
  priceMin: string;
  priceMax: string;
  yearMin: string;
  yearMax: string;
  kmMax: string;
  delivery: boolean;
  opportunitiesOnly: boolean;
  optionals: string[];
}

export const EMPTY_FILTERS: FilterFormState = {
  brand: "",
  category: "",
  city: "",
  fuel: "",
  color: "",
  priceMin: "",
  priceMax: "",
  yearMin: "",
  yearMax: "",
  kmMax: "",
  delivery: false,
  opportunitiesOnly: false,
  optionals: [],
};

/** Converte o estado de formulário (reais como texto) em filtros de API (centavos). */
export function toApiFilters(f: FilterFormState): CatalogFilters {
  const num = (s: string) => {
    const n = Number(s.replace(/\D/g, ""));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const reais = (s: string) => {
    const n = num(s);
    return n === undefined ? undefined : n * 100;
  };
  return {
    brand: f.brand || undefined,
    category: f.category || undefined,
    city: f.city || undefined,
    fuel: f.fuel || undefined,
    color: f.color || undefined,
    priceMin: reais(f.priceMin),
    priceMax: reais(f.priceMax),
    yearMin: num(f.yearMin),
    yearMax: num(f.yearMax),
    kmMax: num(f.kmMax),
    delivery: f.delivery || undefined,
    opportunitiesOnly: f.opportunitiesOnly || undefined,
    optionals: f.optionals.length > 0 ? f.optionals : undefined,
  };
}

interface FilterRailProps {
  f: FilterFormState;
  set: <K extends keyof FilterFormState>(key: K, value: FilterFormState[K]) => void;
  reset: () => void;
  facets: CatalogResponse["facets"] | null;
  drawer?: boolean;
  onClose?: () => void;
}

export function CatalogFilterRail({ f, set, reset, facets, drawer, onClose }: FilterRailProps) {
  const toggleOptional = (opt: string) => {
    const has = f.optionals.includes(opt);
    set("optionals", has ? f.optionals.filter((o) => o !== opt) : [...f.optionals, opt]);
  };

  return (
    <aside className={`crail${drawer ? " crail-drawer" : ""}`}>
      {drawer && (
        <div className="crail-drawer-head">
          <div className="crail-drawer-title">Filtros</div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar filtros">
            <X size={18} />
          </button>
        </div>
      )}
      <div className="crail-card">
        <div className="crail-top">
          <span className="micro">Filtros</span>
          <button className="btn btn-ghost crail-clear" onClick={reset}>
            Limpar
          </button>
        </div>

        <div className="crail-group">
          <label className="lbl">Marca</label>
          <select className="inp" value={f.brand} onChange={(e) => set("brand", e.target.value)}>
            <option value="">Todas</option>
            {facets?.brands.map((b) => (
              <option key={b.brand} value={b.brand}>
                {b.brand} ({b.count})
              </option>
            ))}
          </select>
        </div>

        <div className="crail-group">
          <label className="lbl">Categoria</label>
          <select
            className="inp"
            value={f.category}
            onChange={(e) => set("category", e.target.value)}
          >
            <option value="">Todas</option>
            {facets?.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="crail-group">
          <label className="lbl">Cidade</label>
          <select className="inp" value={f.city} onChange={(e) => set("city", e.target.value)}>
            <option value="">Todas</option>
            {facets?.cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="crail-group">
          <label className="lbl">Preço (R$)</label>
          <div className="crail-row">
            <input
              className="inp"
              inputMode="numeric"
              placeholder="Mín"
              value={f.priceMin}
              onChange={(e) => set("priceMin", e.target.value)}
            />
            <input
              className="inp"
              inputMode="numeric"
              placeholder="Máx"
              value={f.priceMax}
              onChange={(e) => set("priceMax", e.target.value)}
            />
          </div>
        </div>

        <div className="crail-group">
          <label className="lbl">Ano</label>
          <div className="crail-row">
            <input
              className="inp"
              inputMode="numeric"
              placeholder="De"
              value={f.yearMin}
              onChange={(e) => set("yearMin", e.target.value)}
            />
            <input
              className="inp"
              inputMode="numeric"
              placeholder="Até"
              value={f.yearMax}
              onChange={(e) => set("yearMax", e.target.value)}
            />
          </div>
        </div>

        <div className="crail-group">
          <label className="lbl">KM máximo</label>
          <input
            className="inp"
            inputMode="numeric"
            placeholder="Ex.: 80000"
            value={f.kmMax}
            onChange={(e) => set("kmMax", e.target.value)}
          />
        </div>

        <div className="crail-group">
          <label className="lbl">Combustível</label>
          <select className="inp" value={f.fuel} onChange={(e) => set("fuel", e.target.value)}>
            <option value="">Todos</option>
            {facets?.fuels.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {facets && facets.colors.length > 0 && (
          <div className="crail-group">
            <label className="lbl">Cor</label>
            <div className="crail-colors">
              {facets.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  className={`crail-cchip${f.color === c.name ? " on" : ""}`}
                  style={{ background: c.hex ?? "#cbd5e1" }}
                  onClick={() => set("color", f.color === c.name ? "" : c.name)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="crail-group">
          <div className="crail-toggle-row">
            <div>
              <div className="crail-toggle-title">
                <Truck size={15} />
                Aceita delivery
              </div>
              <div className="crail-toggle-sub">Entrega o veículo</div>
            </div>
            <button
              type="button"
              className={`tg${f.delivery ? " on" : ""}`}
              onClick={() => set("delivery", !f.delivery)}
              aria-label="Filtrar por delivery"
            >
              <span />
            </button>
          </div>
        </div>

        <div className="crail-group">
          <div className="crail-toggle-row">
            <div>
              <div className="crail-toggle-title">
                <Flame size={15} color="var(--trending)" />
                Só oportunidades
              </div>
              <div className="crail-toggle-sub">20%+ abaixo da FIPE</div>
            </div>
            <button
              type="button"
              className={`tg${f.opportunitiesOnly ? " on" : ""}`}
              onClick={() => set("opportunitiesOnly", !f.opportunitiesOnly)}
              aria-label="Filtrar só oportunidades"
            >
              <span />
            </button>
          </div>
        </div>

        {facets && facets.optionals.length > 0 && (
          <div className="crail-group">
            <label className="lbl">Opcionais</label>
            <div className="crail-optionals">
              {facets.optionals.map((opt) => {
                const on = f.optionals.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`crail-opt${on ? " on" : ""}`}
                    onClick={() => toggleOptional(opt)}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
