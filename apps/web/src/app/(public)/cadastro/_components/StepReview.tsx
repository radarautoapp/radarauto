/**
 * StepReview — revisa dados retornados da Receita Federal antes de prosseguir.
 */
import { Building2, Check, Lock, MapPin, Phone } from "lucide-react";

import type { CnpjLookupResponse } from "@radar/types";

import { formatCnpj, titleCase } from "./masks";

export interface StepReviewProps {
  data: CnpjLookupResponse;
}

export function StepReview({ data }: StepReviewProps): JSX.Element {
  const principal = data.partners[0];
  const address = [data.street, data.number, data.neighborhood].filter(Boolean).join(", ");
  return (
    <>
      <h1 className="wiz-title">Confirme os dados da empresa</h1>
      <div className="review-card">
        <div className="review-card-head">
          <div className="ic">
            <Building2 size={22} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="legal">{data.legalName}</div>
            {data.tradeName && data.tradeName !== data.legalName && (
              <div className="trade">{data.tradeName}</div>
            )}
          </div>
        </div>

        <dl className="review-section">
          <div className="item">
            <dt>CNPJ</dt>
            <dd>{formatCnpj(data.cnpj)}</dd>
          </div>
          <div className="item">
            <dt>Situação</dt>
            <dd>
              <span
                className="bdg"
                style={{ background: "var(--success-t)", color: "var(--success)" }}
              >
                <Check size={12} />
                {data.status}
              </span>
            </dd>
          </div>

          <div className="item full">
            <dt>
              <MapPin size={11} style={{ display: "inline", marginRight: 4, verticalAlign: -1 }} />
              Endereço
            </dt>
            <dd className={address ? "" : "empty"}>
              {address || "Não informado"}
              <br />
              {data.city} — {data.state}
              {data.zip ? ` · CEP ${data.zip}` : ""}
            </dd>
          </div>

          {data.phone && (
            <div className="item">
              <dt>
                <Phone size={11} style={{ display: "inline", marginRight: 4, verticalAlign: -1 }} />
                Telefone
              </dt>
              <dd>{data.phone}</dd>
            </div>
          )}

          {data.openedAt && (
            <div className="item">
              <dt>Aberta em</dt>
              <dd>{data.openedAt}</dd>
            </div>
          )}

          {principal && (
            <div className="item">
              <dt>Responsável</dt>
              <dd>
                {titleCase(principal.name)}
                {principal.role ? ` · ${principal.role}` : ""}
              </dd>
            </div>
          )}
        </dl>

        <div className="review-locked">
          <Lock size={13} />
          <span>
            Esses dados são oficiais da Receita Federal. Se algo estiver desatualizado, atualize lá
            antes de prosseguir.
          </span>
        </div>
      </div>
    </>
  );
}
