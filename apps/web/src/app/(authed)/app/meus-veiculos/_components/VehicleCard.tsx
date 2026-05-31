/**
 * VehicleCard
 *
 * Card de veículo da loja (tela meus-veículos).
 *  - Foto de capa (ou placeholder)
 *  - Marca/modelo, ano, km, cidade
 *  - Preço + badge de status (Ativo / Aguardando aprovação / etc.)
 *  - Botão "Aprovar" inline quando PENDING e o usuário é lojista
 */
"use client";

import { Car, Check, MapPin, Eye } from "lucide-react";

import type { VehicleListItem } from "@radar/types";
import { Badge, Button } from "@radar/ui";

function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function kmFmt(km: number): string {
  return km.toLocaleString("pt-BR");
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
  onApprove: () => void;
}

export function VehicleCard({
  vehicle,
  canApprove,
  approving,
  onApprove,
}: VehicleCardProps): JSX.Element {
  const meta = STATUS_META[vehicle.status] ?? STATUS_META.DRAFT!;
  const showApprove = canApprove && vehicle.pendingApproval;

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
            <Button
              variant="primary"
              icon={Check}
              onClick={onApprove}
              loading={approving}
              disabled={approving}
            >
              Aprovar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
