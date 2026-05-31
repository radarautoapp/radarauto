/**
 * CatalogCard — card de veículo na vitrine pública.
 *
 * Mostra foto capa, badge de oportunidade, preço, diff FIPE, specs, Radar
 * Score e views. Clicável → leva ao detalhe do veículo (4.6).
 * Difere do VehicleCard de "meus veículos" (que tem gestão/aprovação).
 */
"use client";

import {
  Calendar,
  Car,
  Eye,
  Fuel,
  Gauge,
  Image as ImageIcon,
  MapPin,
  Truck,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { CatalogItem } from "@radar/types";

const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 });

/** Cor do chip de Radar Score conforme faixa. */
function scoreTone(score: number): string {
  if (score >= 90) return "trending";
  if (score >= 80) return "success";
  return "primary";
}

interface CatalogCardProps {
  v: CatalogItem;
  list?: boolean;
}

export function CatalogCard({ v, list }: CatalogCardProps) {
  const router = useRouter();
  const tone = scoreTone(v.rankingScore);
  const isOpportunity = v.diff <= -20;
  const savings = v.fipe > v.price ? v.fipe - v.price : 0;

  return (
    <div
      className={`ccard${list ? " ccard-list" : ""}`}
      onClick={() => router.push(`/app/catalogo/${v.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/app/catalogo/${v.id}`);
      }}
    >
      <div className="ccard-img">
        <div className="ccard-img-inner">
          {v.coverPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.coverPhoto} alt={`${v.brand} ${v.model}`} />
          ) : (
            <Car size={44} strokeWidth={1.4} />
          )}
        </div>
        {isOpportunity && (
          <div className="ccard-ov-tl">
            <span className="bdg ccard-opp">
              <Zap size={12} />
              {v.diff}% FIPE
            </span>
          </div>
        )}
        {v.delivery && (
          <div className="ccard-ov-tr">
            <span className="ccard-delivery" title="Aceita delivery">
              <Truck size={13} />
            </span>
          </div>
        )}
        <div className="ccard-ov-br">
          <span className="ccard-imgcount">
            <ImageIcon size={11} />
            {v.photoCount}
          </span>
        </div>
      </div>

      <div className="ccard-body">
        <div className="ccard-head">
          <div className="ccard-title">
            {v.brand} {v.model}
          </div>
          {!isOpportunity && v.diff < 0 && <span className="ccard-diff">{v.diff}%</span>}
        </div>
        <div className="ccard-version">{v.version}</div>

        <div className="ccard-price">R$ {brl(v.price)}</div>
        {v.fipe > 0 && (
          <div className="ccard-fipe">
            FIPE <b>R$ {brl(v.fipe)}</b>
          </div>
        )}
        {isOpportunity && savings > 0 && (
          <div className="ccard-savings">R$ {brl(savings)} abaixo da FIPE</div>
        )}

        <div className="ccard-specs">
          <span className="ccard-spec">
            <Calendar size={14} />
            {v.year}
          </span>
          <span className="ccard-spec">
            <Gauge size={14} />
            {v.km.toLocaleString("pt-BR")} km
          </span>
          <span className="ccard-spec">
            <Fuel size={14} />
            {v.fuel}
          </span>
          <span className="ccard-spec">
            <MapPin size={14} />
            {v.city}
          </span>
        </div>

        <div className="ccard-foot">
          <span className={`ccard-score ccard-score-${tone}`}>
            <Zap size={12} fill="currentColor" />
            {Math.round(v.rankingScore)}
          </span>
          <span className="ccard-spec">
            <Eye size={14} />
            {v.views.toLocaleString("pt-BR")}
          </span>
        </div>
      </div>
    </div>
  );
}
