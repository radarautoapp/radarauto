/**
 * VehicleCard
 *
 * Card de veículo da loja (tela meus-veículos).
 *  - Foto de capa (ou placeholder)
 *  - Marca/modelo, ano, km, cidade
 *  - Preço + badge de status (Ativo / Aguardando aprovação / etc.)
 *  - Barra de ações em ícones: editar, pausar/reativar, excluir.
 *  - Aprovar em destaque quando PENDING e o usuário é lojista.
 */
"use client";

import {
  Car,
  Check,
  Clock,
  DollarSign,
  Eye,
  MapPin,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react";

import type { VehicleListItem } from "@radar/types";
import { Badge } from "@radar/ui";

function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function kmFmt(km: number): string {
  return km.toLocaleString("pt-BR");
}

/** Tempo restante até a expiração da janela de 24h. */
function expiryInfo(expiresAt: string | null): { label: string; soon: boolean } | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return { label: "Expirando…", soon: true };
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const soon = ms < 3 * 60 * 60 * 1000; // < 3h
  const label = hours >= 1 ? `Expira em ${hours}h` : `Expira em ${mins}min`;
  return { label, soon };
}

const STATUS_META: Record<
  string,
  { label: string; tone: "success" | "warning" | "muted" | "danger" | "primary" }
> = {
  ACTIVE: { label: "Ativo", tone: "success" },
  PENDING: { label: "Aguardando aprovação", tone: "warning" },
  DRAFT: { label: "Rascunho", tone: "muted" },
  INACTIVE: { label: "Pausado", tone: "muted" },
  EXPIRED: { label: "Expirado", tone: "danger" },
  SOLD: { label: "Vendido", tone: "primary" },
  BLOCKED: { label: "Bloqueado", tone: "danger" },
};

export interface VehicleCardProps {
  vehicle: VehicleListItem;
  canApprove: boolean;
  approving: boolean;
  busy: boolean;
  onApprove: () => void;
  onEdit: () => void;
  onTogglePause: () => void;
  onToggleSold: () => void;
  onDelete: () => void;
}

export function VehicleCard({
  vehicle,
  canApprove,
  approving,
  busy,
  onApprove,
  onEdit,
  onTogglePause,
  onToggleSold,
  onDelete,
}: VehicleCardProps): JSX.Element {
  const meta = STATUS_META[vehicle.status] ?? STATUS_META.DRAFT!;
  const showApprove = canApprove && vehicle.pendingApproval;
  const isActive = vehicle.status === "ACTIVE";
  const isPaused = vehicle.status === "INACTIVE";
  // Pausar/reativar só faz sentido para anúncios ativos ou pausados.
  const canTogglePause = isActive || isPaused;
  const isSold = vehicle.status === "SOLD";
  // Vender: a partir de ativo/pausado. Reverter: quando vendido.
  const canSell = isActive || isPaused;

  return (
    <div className="vcard">
      <div className="vcard-photo">
        {vehicle.coverPhoto ? (
          <img src={vehicle.coverPhoto} alt={`${vehicle.brand} ${vehicle.model}`} />
        ) : (
          <div className="vcard-photo-empty">
            <Car size={28} />
          </div>
        )}
        {vehicle.photoCount > 1 && (
          <span className="vcard-photo-count">{vehicle.photoCount} fotos</span>
        )}
      </div>

      <div className="vcard-body">
        <div className="vcard-top">
          <div className="vcard-title">
            {vehicle.brand} {vehicle.model}
          </div>
          <Badge tone={meta.tone}>{meta.label}</Badge>
        </div>

        <div className="vcard-version">{vehicle.version}</div>

        {isActive &&
          (() => {
            const exp = expiryInfo(vehicle.expiresAt);
            if (!exp) return null;
            return (
              <div className={`vcard-expiry${exp.soon ? " soon" : ""}`}>
                <Clock size={12} />
                {exp.label}
              </div>
            );
          })()}

        <div className="vcard-specs">
          <span>
            {vehicle.year}/{vehicle.yearModel}
          </span>
          <span>·</span>
          <span>{kmFmt(vehicle.km)} km</span>
          <span>·</span>
          <span>{vehicle.color}</span>
        </div>

        <div className="vcard-loc">
          <MapPin size={13} />
          {vehicle.city} — {vehicle.state}
        </div>

        <div className="vcard-foot">
          <div className="vcard-price">R$ {brl(vehicle.price)}</div>
          <div className="vcard-stats">
            <span title="Visualizações">
              <Eye size={14} /> {vehicle.views}
            </span>
          </div>
        </div>

        {showApprove && (
          <div className="vcard-approve">
            <div className="vcard-approve-info">
              Cadastrado por <strong>{vehicle.createdByName}</strong>
            </div>
            <button
              type="button"
              className="vcard-approve-btn"
              onClick={onApprove}
              disabled={approving}
            >
              <Check size={16} />
              {approving ? "Aprovando..." : "Aprovar"}
            </button>
          </div>
        )}

        <div className="vcard-actions">
          <button
            type="button"
            className="vcard-act"
            title="Editar"
            aria-label="Editar"
            onClick={onEdit}
            disabled={busy}
          >
            <Pencil size={16} />
          </button>
          {canTogglePause && (
            <button
              type="button"
              className="vcard-act"
              title={isActive ? "Pausar anúncio" : "Reativar anúncio"}
              aria-label={isActive ? "Pausar" : "Reativar"}
              onClick={onTogglePause}
              disabled={busy}
            >
              {isActive ? <Pause size={16} /> : <Play size={16} />}
            </button>
          )}
          <button
            type="button"
            className="vcard-act vcard-act-danger"
            title="Excluir"
            aria-label="Excluir"
            onClick={onDelete}
            disabled={busy}
          >
            <Trash2 size={16} />
          </button>

          {(canSell || isSold) && (
            <button
              type="button"
              className={`vcard-act vcard-act-sold${isSold ? " on" : ""}`}
              title={isSold ? "Reverter venda" : "Marcar como vendido"}
              aria-label={isSold ? "Reverter venda" : "Marcar como vendido"}
              onClick={onToggleSold}
              disabled={busy}
            >
              {isSold ? <RotateCcw size={16} /> : <DollarSign size={16} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
