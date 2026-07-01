/**
 * /app/admin/dashboard — [ADMIN] Visao geral completa da plataforma.
 *
 * Paineis: metricas-chave, crescimento (30d), receita estimada (sem Stripe
 * ainda), vendas/saude do catalogo, ranking de lojas, funil de leads e
 * distribuicao geografica. Graficos em SVG puro (sem dependencia nova).
 */
"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { AdminOverview } from "@radar/types";
import { Skeleton } from "@radar/ui";

import { toFriendlyError } from "@/lib/error-messages";
import { storesApi } from "@/lib/stores-api";
import { useAuthStore } from "@/stores/auth.store";

import "./overview.css";

function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/** Projecao simples (linear) do MRR do proximo mes, a partir da media semanal
 * de novos assinantes nas ultimas semanas. Retorna null se nao houver dados
 * suficientes (menos de 2 semanas). Estimativa grosseira, nao e modelo financeiro. */
function estimateNextMonthMrr(mrrCents: number, trend: AdminOverview["mrrTrend"]): number | null {
  if (trend.length < 2) return null;
  const avgWeekly = trend.reduce((a, b) => a + b.newSubscribers, 0) / trend.length;
  const projectedNewSubs = avgWeekly * 4;
  const AVG_TICKET_CENTS = 8500; // media aproximada entre os 3 ciclos
  return Math.round(mrrCents + projectedNewSubs * AVG_TICKET_CENTS);
}

function GrowthChart({ data }: { data: AdminOverview["growth"] }): JSX.Element {
  const W = 600;
  const H = 180;
  const PAD = 6;
  const maxVal = Math.max(1, ...data.flatMap((d) => [d.stores, d.vehicles, d.leads]));
  const xStep = data.length > 1 ? (W - PAD * 2) / (data.length - 1) : 0;
  const yScale = (v: number): number => H - PAD - (v / maxVal) * (H - PAD * 2);

  const pathFor = (key: "stores" | "vehicles" | "leads"): string =>
    data
      .map(
        (d, i) =>
          `${i === 0 ? "M" : "L"} ${(PAD + i * xStep).toFixed(2)} ${yScale(d[key]).toFixed(2)}`,
      )
      .join(" ");

  const labelIdx = [0, 6, 12, 18, 24, data.length - 1].filter(
    (v, i, arr) => v < data.length && arr.indexOf(v) === i,
  );

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="growth-chart" preserveAspectRatio="none">
        {[0, 0.33, 0.66, 1].map((frac) => (
          <line
            key={frac}
            x1={PAD}
            x2={W - PAD}
            y1={H - PAD - frac * (H - PAD * 2)}
            y2={H - PAD - frac * (H - PAD * 2)}
            className="growth-grid"
          />
        ))}
        <path d={pathFor("leads")} className="growth-line line-leads" />
        <path d={pathFor("vehicles")} className="growth-line line-vehicles" />
        <path d={pathFor("stores")} className="growth-line line-stores" />
        {labelIdx.map((i) => (
          <text
            key={i}
            x={PAD + i * xStep}
            y={H + 16}
            fontSize="9"
            fill="var(--muted, #94a3b8)"
            textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
          >
            {formatDayLabel(data[i]!.date)}
          </text>
        ))}
      </svg>
      <div className="growth-legend">
        <span className="growth-legend-item">
          <span className="growth-legend-dot" style={{ background: "var(--primary, #2563eb)" }} />
          Lojas novas
        </span>
        <span className="growth-legend-item">
          <span className="growth-legend-dot" style={{ background: "var(--success, #10b981)" }} />
          Veículos novos
        </span>
        <span className="growth-legend-item">
          <span className="growth-legend-dot" style={{ background: "#ff6b00" }} />
          Leads gerados
        </span>
      </div>
    </>
  );
}

export default function AdminDashboardPage(): JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await storesApi.getOverview();
      setOverview(res);
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

  if (!user || user.role !== "admin") {
    return <div className="page-wrap" />;
  }

  const projection = overview
    ? estimateNextMonthMrr(overview.mrrEstimateCents, overview.mrrTrend)
    : null;
  const maxGeo = overview ? Math.max(1, ...overview.byState.map((s) => s.vehicles)) : 1;
  const maxRank = overview ? Math.max(1, ...overview.topStores.map((s) => s.activeVehicles)) : 1;
  const funnelTotal = overview
    ? Math.max(1, overview.leadFunnel.hot + overview.leadFunnel.warm + overview.leadFunnel.cold)
    : 1;

  return (
    <div className="page-wrap overview-page">
      {error && <p className="muted">{error}</p>}

      {loading && (
        <>
          <Skeleton height="150px" />
          <Skeleton height="220px" />
        </>
      )}

      {!loading && overview && (
        <>
          {/* ---- Metricas-chave ---- */}
          <div className="overview-panel">
            <div
              className="overview-section overview-section-clickable"
              onClick={() => router.push("/app/admin/lojistas")}
              role="button"
              tabIndex={0}
            >
              <div className="overview-section-label">Lojas</div>
              <div className="overview-stat-row">
                <span className="overview-stat-num">{overview.storesTotal}</span>
                <span className="overview-stat-label">cadastradas</span>
              </div>
              <div className="overview-stat-row">
                <span className="overview-stat-num accent-green">{overview.storesApproved}</span>
                <span className="overview-stat-label">aprovadas</span>
              </div>
              <div className="overview-stat-row">
                <span className="overview-stat-num accent-amber">{overview.storesPending}</span>
                <span className="overview-stat-label">pendentes</span>
              </div>
            </div>

            <div className="overview-section">
              <div className="overview-section-label">Veículos</div>
              <div className="overview-stat-row">
                <span className="overview-stat-num">{overview.vehiclesActive}</span>
                <span className="overview-stat-label">ativos no catálogo</span>
              </div>
              <div className="overview-stat-row">
                <span className="overview-stat-num accent-green">{overview.vehiclesNew7d}</span>
                <span className="overview-stat-label">novos (7 dias)</span>
              </div>
            </div>

            <div className="overview-section">
              <div className="overview-section-label">Compradores</div>
              <div className="overview-stat-row">
                <span className="overview-stat-num">{overview.buyersTotal}</span>
                <span className="overview-stat-label">cadastrados</span>
              </div>
              <div className="overview-stat-row">
                <span className="overview-stat-num accent-green">{overview.buyersNew7d}</span>
                <span className="overview-stat-label">novos (7 dias)</span>
              </div>
            </div>

            <div className="overview-section">
              <div className="overview-section-label">Leads</div>
              <div className="overview-stat-row">
                <span className="overview-stat-num">{overview.leadsTotal}</span>
                <span className="overview-stat-label">gerados</span>
              </div>
              <div className="overview-stat-row">
                <span className="overview-stat-num accent-green">{overview.leadsNew7d}</span>
                <span className="overview-stat-label">novos (7 dias)</span>
              </div>
            </div>
          </div>

          {/* ---- Crescimento ---- */}
          <div>
            <div className="dash-section-title">Crescimento</div>
            <div className="dash-section-sub">Últimos 30 dias</div>
            <div className="dash-card">
              <GrowthChart data={overview.growth} />
            </div>
          </div>

          {/* ---- Receita + Vendas ---- */}
          <div className="dash-row">
            <div>
              <div className="dash-section-title">Receita mensal</div>
              <div className="dash-section-sub">
                Estimativa — cobrança via Stripe ainda não integrada
              </div>
              <div className="dash-card">
                <span className="revenue-badge">Estimativa</span>
                <div className="revenue-main">
                  <strong>R$ {brl(overview.mrrEstimateCents)}</strong>
                  <span>/mês (MRR)</span>
                </div>
                <div className="revenue-sub">{overview.activeSubscribers} assinantes ativos</div>
                <div className="revenue-projection">
                  <span className="revenue-projection-label">Projeção próximo mês</span>
                  <span className="revenue-projection-value">
                    {projection !== null ? `R$ ${brl(projection)}` : "sem dados suficientes"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="dash-section-title">Vendas &amp; catálogo</div>
              <div className="dash-section-sub">Veículos marcados como vendidos</div>
              <div className="dash-card">
                <div className="sales-grid">
                  <div className="sales-stat">
                    <strong>{overview.soldTotal}</strong>
                    <span>vendidos (total)</span>
                  </div>
                  <div className="sales-stat">
                    <strong>{overview.soldThisMonth}</strong>
                    <span>vendidos (mês)</span>
                  </div>
                  <div className="sales-stat">
                    <strong>
                      {overview.avgDiscountPercent !== null
                        ? `${overview.avgDiscountPercent.toFixed(1)}%`
                        : "—"}
                    </strong>
                    <span>desconto médio vs FIPE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---- Ranking + Funil ---- */}
          <div className="dash-row">
            <div>
              <div className="dash-section-title">Top lojas</div>
              <div className="dash-section-sub">Por veículos ativos no catálogo</div>
              <div className="dash-card">
                {overview.topStores.length === 0 ? (
                  <p className="dash-empty">Nenhuma loja com veículos ativos ainda.</p>
                ) : (
                  <div className="rank-list">
                    {overview.topStores.map((s, i) => (
                      <div key={s.id} className="rank-row">
                        <span className="rank-pos">{i + 1}</span>
                        <span className="rank-name">{s.name}</span>
                        <span className="rank-value">{s.activeVehicles}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="dash-section-title">Funil de leads</div>
              <div className="dash-section-sub">Qualificação por temperatura</div>
              <div className="dash-card">
                <div className="funnel-list">
                  {(
                    [
                      ["hot", "Quente", overview.leadFunnel.hot],
                      ["warm", "Morno", overview.leadFunnel.warm],
                      ["cold", "Frio", overview.leadFunnel.cold],
                    ] as const
                  ).map(([key, label, value]) => (
                    <div key={key} className="funnel-row">
                      <span className={`funnel-label ${key}`}>{label}</span>
                      <div className="funnel-bar-wrap">
                        <div
                          className={`funnel-bar ${key}`}
                          style={{ width: `${(value / funnelTotal) * 100}%` }}
                        />
                      </div>
                      <span className="funnel-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ---- Geografia ---- */}
          <div>
            <div className="dash-section-title">Distribuição geográfica</div>
            <div className="dash-section-sub">Veículos ativos por estado</div>
            <div className="dash-card">
              {overview.byState.length === 0 ? (
                <p className="dash-empty">Sem dados geográficos ainda.</p>
              ) : (
                <div className="geo-list">
                  {overview.byState.map((s) => (
                    <div key={s.state} className="geo-row">
                      <span className="geo-state">{s.state}</span>
                      <div className="geo-bar-wrap">
                        <div
                          className="geo-bar"
                          style={{ width: `${(s.vehicles / maxGeo) * 100}%` }}
                        />
                      </div>
                      <span className="geo-count">
                        {s.vehicles} veíc. · {s.stores} {s.stores === 1 ? "loja" : "lojas"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
