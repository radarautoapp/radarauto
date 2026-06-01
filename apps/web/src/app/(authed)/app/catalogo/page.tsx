/**
 * /app/catalogo — Catálogo público (vitrine de descoberta).
 *
 * Lista veículos ACTIVE de TODAS as lojas. Filtros completos, ordenação
 * (relevância/preço/recente), paginação enumerada (40/página), Radar de
 * Oportunidades no topo e cards clicáveis que levam ao detalhe (4.6).
 */
"use client";

import {
  AlertCircle,
  ArrowDownWideNarrow,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { CatalogResponse, CatalogSort } from "@radar/types";
import { EmptyState, Skeleton } from "@radar/ui";

import { toFriendlyError } from "@/lib/error-messages";

import { catalogApi } from "./_lib/catalog-api";
import { CatalogCard } from "./_components/CatalogCard";
import {
  CatalogFilterRail,
  EMPTY_FILTERS,
  toApiFilters,
  type FilterFormState,
} from "./_components/CatalogFilterRail";

const PAGE_SIZE = 40;

const SORTS: { id: CatalogSort; label: string; hint?: string }[] = [
  { id: "relevance", label: "Relevância", hint: "Radar Score" },
  { id: "price_asc", label: "Menor preço" },
  { id: "price_desc", label: "Maior preço" },
  { id: "recent", label: "Mais recentes" },
];

const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 });

export default function CatalogPage() {
  const router = useRouter();

  const [filters, setFilters] = useState<FilterFormState>(EMPTY_FILTERS);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CatalogSort>("relevance");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "list">("grid");

  const [data, setData] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortOpen, setSortOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);

  const setFilter = useCallback(
    <K extends keyof FilterFormState>(key: K, value: FilterFormState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }, []);

  const apiFilters = useMemo(() => toApiFilters(filters), [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await catalogApi.list({
        ...apiFilters,
        q: query.trim() || undefined,
        sort,
        page,
        pageSize: PAGE_SIZE,
      });
      setData(res);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [apiFilters, query, sort, page]);

  // Debounce leve para busca/filtros não dispararem a cada tecla.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const facets = data?.facets ?? null;
  const opportunities = data?.opportunities ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    const add = (key: string, label: string, clear: () => void) =>
      chips.push({ key, label, clear });
    if (filters.brand) add("brand", filters.brand, () => setFilter("brand", ""));
    if (filters.category) add("category", filters.category, () => setFilter("category", ""));
    if (filters.city) add("city", filters.city, () => setFilter("city", ""));
    if (filters.fuel) add("fuel", filters.fuel, () => setFilter("fuel", ""));
    if (filters.color) add("color", filters.color, () => setFilter("color", ""));
    if (filters.priceMin)
      add("priceMin", `≥ R$ ${filters.priceMin}`, () => setFilter("priceMin", ""));
    if (filters.priceMax)
      add("priceMax", `≤ R$ ${filters.priceMax}`, () => setFilter("priceMax", ""));
    if (filters.yearMin) add("yearMin", `${filters.yearMin}+`, () => setFilter("yearMin", ""));
    if (filters.yearMax) add("yearMax", `até ${filters.yearMax}`, () => setFilter("yearMax", ""));
    if (filters.kmMax) add("kmMax", `≤ ${filters.kmMax} km`, () => setFilter("kmMax", ""));
    if (filters.delivery) add("delivery", "Delivery", () => setFilter("delivery", false));
    if (filters.opportunitiesOnly)
      add("opp", "Oportunidades", () => setFilter("opportunitiesOnly", false));
    filters.optionals.forEach((opt) =>
      add(`opt-${opt}`, opt, () =>
        setFilter(
          "optionals",
          filters.optionals.filter((o) => o !== opt),
        ),
      ),
    );
    return chips;
  }, [filters, setFilter]);

  const activeCount = activeChips.length;

  const sortLabel = SORTS.find((s) => s.id === sort)?.label ?? "Relevância";

  return (
    <div className="page-wrap catalog">
      {/* Busca */}
      <div className="catalog-search">
        <Search size={18} />
        <input
          className="inp"
          placeholder="Buscar marca, modelo ou versão..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Radar de Oportunidades */}
      {opportunities.length > 0 && (
        <div className="catalog-opp">
          <div className="catalog-opp-head">
            <div className="catalog-opp-title">
              <span className="catalog-opp-icon">
                <Flame size={18} />
              </span>
              <div>
                <div className="catalog-opp-h">Radar de Oportunidades</div>
                <div className="catalog-opp-sub">Bem abaixo da FIPE — detectados pela engine</div>
              </div>
            </div>
            <span className="bdg catalog-opp-count">
              <Zap size={12} />
              {opportunities.length} agora
            </span>
          </div>
          <div className="catalog-opp-row">
            {opportunities.map((v) => (
              <button
                key={v.id}
                type="button"
                className="catalog-opp-mini"
                onClick={() => router.push(`/app/catalogo/${v.id}`)}
              >
                <div className="catalog-opp-mini-head">
                  <span className="catalog-opp-mini-title">
                    {v.brand} {v.model}
                  </span>
                  <span className="catalog-opp-mini-diff">{v.diff}%</span>
                </div>
                <div className="catalog-opp-mini-price">R$ {brl(v.price)}</div>
                <div className="catalog-opp-mini-sub">
                  FIPE R$ {brl(v.fipe)} · {v.city}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="catalog-toolbar">
        <div className="catalog-count">
          {loading ? (
            "Carregando..."
          ) : (
            <>
              <span className="catalog-count-num">{total}</span> veículos
            </>
          )}
        </div>

        <button className="catalog-fab" onClick={() => setDrawer(true)}>
          <SlidersHorizontal size={16} />
          Filtros
          {activeCount > 0 && <span className="catalog-fab-badge">{activeCount}</span>}
        </button>

        <div className="catalog-toolbar-end">
          <button className="icon-btn" onClick={load} title="Atualizar" aria-label="Atualizar">
            <RotateCcw size={17} className={loading ? "catalog-spin" : ""} />
          </button>

          <div className="catalog-dd">
            <button className="catalog-dd-btn" onClick={() => setSortOpen((v) => !v)}>
              <ArrowDownWideNarrow size={16} />
              {sortLabel}
              <ChevronDown size={15} />
            </button>
            {sortOpen && (
              <>
                <div className="catalog-dd-backdrop" onClick={() => setSortOpen(false)} />
                <div className="catalog-dd-menu">
                  {SORTS.map((s) => (
                    <button
                      key={s.id}
                      className={`catalog-dd-item${sort === s.id ? " on" : ""}`}
                      onClick={() => {
                        setSort(s.id);
                        setPage(1);
                        setSortOpen(false);
                      }}
                    >
                      {s.id === "relevance" && <Zap size={15} />}
                      {s.label}
                      {s.hint && <span className="catalog-dd-hint">{s.hint}</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="catalog-vtoggle">
            <button
              className={view === "grid" ? "on" : ""}
              onClick={() => setView("grid")}
              aria-label="Visão em grade"
            >
              <LayoutGrid size={17} />
            </button>
            <button
              className={view === "list" ? "on" : ""}
              onClick={() => setView("list")}
              aria-label="Visão em lista"
            >
              <List size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Chips ativos */}
      {activeChips.length > 0 && (
        <div className="catalog-chips">
          {activeChips.map((c) => (
            <span key={c.key} className="catalog-chip">
              {c.label}
              <button onClick={c.clear} aria-label={`Remover ${c.label}`}>
                <X size={11} />
              </button>
            </span>
          ))}
          <button className="btn btn-ghost catalog-chips-clear" onClick={resetFilters}>
            Limpar tudo
          </button>
        </div>
      )}

      {/* Layout: filtros + grid */}
      <div className="catalog-main">
        {drawer && (
          <>
            <div className="catalog-drawer-back" onClick={() => setDrawer(false)} />
            <CatalogFilterRail
              f={filters}
              set={setFilter}
              reset={resetFilters}
              facets={facets}
              drawer
              onClose={() => setDrawer(false)}
            />
          </>
        )}

        <div className="catalog-results">
          {loading ? (
            <div className="catalog-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="ccard ccard-skeleton">
                  <Skeleton height={168} />
                  <div className="ccard-skeleton-body">
                    <Skeleton height={16} />
                    <Skeleton height={12} />
                    <Skeleton height={22} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertCircle}
              title="Não foi possível carregar o catálogo"
              description={error}
              cta={{ label: "Tentar novamente", onClick: load, icon: RotateCcw }}
            />
          ) : total === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhum veículo encontrado"
              description="Tente ajustar ou limpar os filtros para ver mais resultados."
              cta={{ label: "Limpar filtros", onClick: resetFilters }}
            />
          ) : (
            <>
              <div className={`catalog-grid${view === "list" ? " catalog-grid-list" : ""}`}>
                {data?.items.map((v, idx) => (
                  <CatalogCard key={v.id || `locked-${idx}`} v={v} list={view === "list"} />
                ))}
              </div>

              {data?.premium && totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Paginação enumerada com elipses. */
function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages = useMemo(() => pageNumbers(page, totalPages), [page, totalPages]);

  const go = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    onChange(p);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="catalog-pagination" aria-label="Paginação">
      <button className="catalog-page-btn" onClick={() => go(page - 1)} disabled={page === 1}>
        <ChevronLeft size={16} />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="catalog-page-gap">
            …
          </span>
        ) : (
          <button
            key={p}
            className={`catalog-page-btn${p === page ? " on" : ""}`}
            onClick={() => go(p)}
          >
            {p}
          </button>
        ),
      )}
      <button
        className="catalog-page-btn"
        onClick={() => go(page + 1)}
        disabled={page === totalPages}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

/** Gera a sequência de páginas com elipses (1 … 4 5 6 … 20). */
function pageNumbers(current: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const window = 1; // vizinhos de cada lado
  const push = (p: number) => out.push(p);

  for (let p = 1; p <= total; p++) {
    const nearEdge = p === 1 || p === total;
    const nearCurrent = Math.abs(p - current) <= window;
    if (nearEdge || nearCurrent) {
      push(p);
    } else if (out[out.length - 1] !== "…") {
      out.push("…");
    }
  }
  return out;
}
