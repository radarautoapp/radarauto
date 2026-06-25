/**
 * /app/leads — Engine de Leads (visão do lojista).
 *
 * Acordeon por veículo: cada anúncio expande mostrando seus interessados,
 * qualificados em HOT/WARM/COLD por comportamento (visitas, tempo de tela,
 * favoritos, tentativas de contato). Cada lead tem um termômetro de pontos.
 */
"use client";

export const dynamic = "force-dynamic";

import {
  ChevronDown,
  Clock,
  Eye,
  Flame,
  Heart,
  Phone,
  Send,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { LeadItem, LeadsResponse, LeadVehicleGroup } from "@radar/types";
import { Avatar, EmptyState, Skeleton, WhatsAppIcon } from "@radar/ui";

import { toFriendlyError } from "@/lib/error-messages";
import { leadsApi } from "@/lib/leads-api";

const brl = (cents: number): string =>
  (cents / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 });

type Temp = "hot" | "warm" | "cold";
const tempOf = (score: string): Temp =>
  score === "HOT" ? "hot" : score === "WARM" ? "warm" : "cold";
const TEMP_LABEL: Record<Temp, string> = { hot: "Quente", warm: "Morno", cold: "Frio" };

function timeFmt(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest > 0 ? `${min}m${rest}s` : `${min}min`;
}

function lastSeenFmt(iso: string): string {
  const d = new Date(iso);
  const diffH = (Date.now() - d.getTime()) / (1000 * 60 * 60);
  if (diffH < 1) return "há pouco";
  if (diffH < 24) return `há ${Math.floor(diffH)}h`;
  const days = Math.floor(diffH / 24);
  return days === 1 ? "ontem" : `há ${days} dias`;
}

function LeadRow({ lead, index }: { lead: LeadItem; index: number }): JSX.Element {
  const temp = tempOf(lead.score);
  return (
    <div
      className={`lead-row temp-${temp}`}
      style={{ animationDelay: `${Math.min(index * 45, 270)}ms` }}
    >
      <Avatar initials={lead.name.slice(0, 2).toUpperCase()} size={42} />

      <div className="lead-row-body">
        <div className="lead-row-line">
          <span className="lead-name">{lead.name}</span>
          <span className={`lead-temp-pill temp-${temp}`}>
            {temp === "hot" && <Flame size={11} fill="currentColor" />}
            {TEMP_LABEL[temp]}
          </span>
          <span className="lead-lastseen">{lastSeenFmt(lead.lastSeen)}</span>
        </div>

        {/* Termômetro de pontos */}
        <div className="lead-meter" title={`${lead.points} pontos de engajamento`}>
          <div className={`lead-meter-fill temp-${temp}`} style={{ width: `${lead.points}%` }} />
        </div>

        <div className="lead-signals">
          <span className="lead-signal" title="Visitas ao anúncio">
            <Eye size={13} /> {lead.clicks} {lead.clicks === 1 ? "visita" : "visitas"}
          </span>
          <span className="lead-signal" title="Tempo na tela">
            <Clock size={13} /> {timeFmt(lead.timeSeconds)}
          </span>
          {lead.favorited && (
            <span className="lead-signal sig-fav" title="Favoritou">
              <Heart size={13} fill="currentColor" /> Favoritou
            </span>
          )}
          {lead.whatsappClicked && (
            <span className="lead-signal sig-wa" title="Chamou no WhatsApp">
              <WhatsAppIcon size={13} /> WhatsApp
            </span>
          )}
          {lead.telegramClicked && (
            <span className="lead-signal sig-tg" title="Chamou no Telegram">
              <Send size={13} /> Telegram
            </span>
          )}
        </div>
      </div>

      {lead.phone && (
        <a className="lead-call" href={`tel:${lead.phone.replace(/\D/g, "")}`} title="Ligar">
          <Phone size={15} />
          <span>{lead.phone}</span>
        </a>
      )}
    </div>
  );
}

function VehicleAccordion({
  group,
  defaultOpen,
}: {
  group: LeadVehicleGroup;
  defaultOpen: boolean;
}): JSX.Element {
  const [open, setOpen] = useState(defaultOpen);
  const hasLeads = group.totalLeads > 0;
  const heat: Temp = group.hotCount > 0 ? "hot" : hasLeads ? "warm" : "cold";

  return (
    <div className={`lead-card heat-${heat}${open ? " open" : ""}${hasLeads ? "" : " empty"}`}>
      <button
        type="button"
        className="lead-card-head"
        onClick={() => hasLeads && setOpen((v) => !v)}
        disabled={!hasLeads}
      >
        <div className="lead-card-photo">
          {group.coverPhoto ? (
            <img src={group.coverPhoto} alt={`${group.brand} ${group.model}`} />
          ) : (
            <div className="lead-card-photo-empty" />
          )}
        </div>

        <div className="lead-card-info">
          <div className="lead-card-title">
            {group.brand} {group.model}
          </div>
          <div className="lead-card-sub">
            {group.version} · {group.year} · R$ {brl(group.price)}
          </div>
        </div>

        <div className="lead-card-stats">
          {group.hotCount > 0 && (
            <span className="lead-hot-chip">
              <Flame size={13} fill="currentColor" />
              {group.hotCount} {group.hotCount === 1 ? "quente" : "quentes"}
            </span>
          )}
          <span className="lead-count-chip">
            <Users size={13} />
            {group.totalLeads}
          </span>
          {hasLeads && <ChevronDown size={18} className="lead-card-chev" />}
        </div>
      </button>

      {open && hasLeads && (
        <div className="lead-card-body">
          {group.leads.map((lead, i) => (
            <LeadRow key={lead.id} lead={lead} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LeadsPage(): JSX.Element {
  const [data, setData] = useState<LeadsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      setData(await leadsApi.list());
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const withLeads = data?.items.filter((it) => it.totalLeads > 0) ?? [];

  return (
    <div className="page-wrap leads-page">
      {!loading && data && data.totalLeads > 0 && (
        <div className="leads-hero">
          <div className="leads-hero-stat">
            <div className="leads-hero-ico ico-blue">
              <Users size={20} />
            </div>
            <div className="leads-hero-num">
              <strong>{data.totalLeads}</strong>
              <span>interessados</span>
            </div>
          </div>
          <div className="leads-hero-divider" />
          <div className="leads-hero-stat">
            <div className="leads-hero-ico ico-hot">
              <Flame size={20} fill="currentColor" />
            </div>
            <div className="leads-hero-num">
              <strong>{data.totalHot}</strong>
              <span>leads quentes</span>
            </div>
          </div>
          <div className="leads-hero-divider" />
          <div className="leads-hero-stat">
            <div className="leads-hero-ico ico-green">
              <TrendingUp size={20} />
            </div>
            <div className="leads-hero-num">
              <strong>{withLeads.length}</strong>
              <span>anúncios com interesse</span>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="lead-list">
          <Skeleton height="88px" />
          <Skeleton height="88px" />
          <Skeleton height="88px" />
        </div>
      )}

      {!loading && error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && data && data.items.length === 0 && (
        <EmptyState
          icon={Users}
          title="Nenhum veículo cadastrado"
          description="Cadastre veículos para começar a capturar interessados. O RadarAuto qualifica cada lead por comportamento real."
        />
      )}

      {!loading && !error && data && withLeads.length > 0 && (
        <div className="lead-list">
          {withLeads.map((group, i) => (
            <VehicleAccordion key={group.vehicleId} group={group} defaultOpen={i === 0} />
          ))}
        </div>
      )}

      {!loading && !error && data && data.items.length > 0 && withLeads.length === 0 && (
        <EmptyState
          icon={Users}
          title="Ainda sem interessados"
          description="Seus veículos estão publicados, mas ainda não receberam interesse. Assim que alguém visitar, favoritar ou chamar no WhatsApp, o lead aparece aqui qualificado."
        />
      )}
    </div>
  );
}
