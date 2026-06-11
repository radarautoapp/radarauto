/**
 * /app/planos — Planos Premium (visual premium, checkout inline).
 *
 * FREE: três planos; ao escolher, abre o checkout inline (resumo + cupom +
 * forma de pagamento preparada para Stripe Elements).
 * PREMIUM: painel da assinatura (plano, status, forma de pagamento) com troca
 * de plano e cancelamento (modal de confirmação).
 *
 * NOTA DE SEGURANÇA: dados de cartão NUNCA passam pelo nosso front/back. O
 * bloco de cartão aqui é a casca visual; a captura real será via Stripe
 * Elements (iframe PCI-compliant) quando o billing for integrado.
 */
"use client";

import { Check, Copy, CreditCard, Crown, Lock, QrCode, Sparkles, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { SubscriptionCycle, SubscriptionStatus } from "@radar/types";
import { ConfirmModal } from "@radar/ui";

import { useAuthStore } from "@/stores/auth.store";

type PlanId = "monthly" | "quarterly" | "annual";

interface Plan {
  id: PlanId;
  cycle: SubscriptionCycle;
  name: string;
  perMonth: number;
  total: number;
  cycleMonths: number;
  billingNote: string;
  savingsPercent: number | null;
  highlight: boolean;
}

const BASE = 99;

const PLANS: Plan[] = [
  {
    id: "monthly",
    cycle: "monthly",
    name: "Mensal",
    perMonth: 99,
    total: 99,
    cycleMonths: 1,
    billingNote: "Cobrado mensalmente",
    savingsPercent: null,
    highlight: false,
  },
  {
    id: "quarterly",
    cycle: "quarterly",
    name: "Trimestral",
    perMonth: 79.9,
    total: 239.7,
    cycleMonths: 3,
    billingNote: "R$ 239,70 a cada 3 meses",
    savingsPercent: Math.round((1 - 79.9 / BASE) * 100),
    highlight: true,
  },
  {
    id: "annual",
    cycle: "yearly",
    name: "Anual",
    perMonth: 69.9,
    total: 838.8,
    cycleMonths: 12,
    billingNote: "R$ 838,80 cobrado uma vez por ano",
    savingsPercent: Math.round((1 - 69.9 / BASE) * 100),
    highlight: false,
  },
];

const BENEFITS = [
  "Contato direto com os leads (telefone e WhatsApp)",
  "Engine de Leads com qualificação Quente / Morno / Frio",
  "Catálogo sem desfoque — veja todos os anúncios",
  "Insights e analytics dos seus veículos",
  "Prioridade e selo de destaque no feed",
];

const CYCLE_LABEL: Record<SubscriptionCycle, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  yearly: "Anual",
};

const STATUS_META: Record<
  SubscriptionStatus,
  { label: string; tone: "active" | "warning" | "danger" }
> = {
  active: { label: "Ativo", tone: "active" },
  trialing: { label: "Em teste", tone: "active" },
  cancelled: { label: "Cancelado", tone: "warning" },
  past_due: { label: "Pagamento pendente", tone: "danger" },
};

// Cupons de exemplo (a validação real será no backend).
const COUPONS: Record<string, number> = { RADAR10: 10, BEMVINDO: 15, PREMIUM20: 20 };

const brl = (v: number): string =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ====================== Bloco de cupom ====================== */
function CouponField({
  onApply,
  applied,
}: {
  onApply: (code: string, percent: number | null) => void;
  applied: { code: string; percent: number } | null;
}): JSX.Element {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const apply = (): void => {
    const key = code.trim().toUpperCase();
    if (!key) return;
    const percent = COUPONS[key];
    if (percent) {
      setError(null);
      onApply(key, percent);
    } else {
      setError("Cupom inválido ou expirado.");
      onApply("", null);
    }
  };

  if (applied) {
    return (
      <div className="coupon-applied">
        <Tag size={15} />
        <span>
          Cupom <strong>{applied.code}</strong> aplicado — {applied.percent}% off
        </span>
        <button type="button" onClick={() => onApply("", null)} aria-label="Remover cupom">
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="coupon-field">
      <div className="coupon-input-wrap">
        <Tag size={15} />
        <input
          type="text"
          placeholder="Tem um cupom de desconto?"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && apply()}
        />
      </div>
      <button type="button" className="coupon-apply" onClick={apply}>
        Aplicar
      </button>
      {error && <div className="coupon-error">{error}</div>}
    </div>
  );
}

/* ====================== Forma de pagamento (Stripe-ready) ====================== */
function PaymentSection(): JSX.Element {
  return (
    <div className="pay-section">
      <div className="pay-label">
        <CreditCard size={16} />
        Forma de pagamento
      </div>
      {/* Casca visual — substituída pelo Stripe Elements (iframe seguro) na
          integração de billing. Nenhum dado de cartão trafega pelo nosso sistema. */}
      <div className="pay-card-mock" aria-hidden="true">
        <div className="pay-field pay-field-full">
          <span className="pay-field-label">Número do cartão</span>
          <div className="pay-field-box">
            <span className="pay-placeholder">•••• •••• •••• ••••</span>
            <div className="pay-brands">
              <span className="pay-brand">VISA</span>
              <span className="pay-brand">MC</span>
            </div>
          </div>
        </div>
        <div className="pay-field-row">
          <div className="pay-field">
            <span className="pay-field-label">Validade</span>
            <div className="pay-field-box">
              <span className="pay-placeholder">MM / AA</span>
            </div>
          </div>
          <div className="pay-field">
            <span className="pay-field-label">CVV</span>
            <div className="pay-field-box">
              <span className="pay-placeholder">•••</span>
            </div>
          </div>
        </div>
      </div>
      <div className="pay-secure">
        <Lock size={12} />
        Pagamento processado com segurança via Stripe. Seus dados de cartão são criptografados e
        nunca passam pelos nossos servidores.
      </div>
    </div>
  );
}

/* ====================== Pix ====================== */
function PixSection({ amount }: { amount: string }): JSX.Element {
  const [copied, setCopied] = useState(false);
  // Código copia-e-cola de exemplo — gerado de verdade pelo gateway na integração.
  const pixCode =
    "00020126580014br.gov.bcb.pix0136radarauto-pix-exemplo-chave520400005303986540" +
    amount.replace(/\D/g, "") +
    "5802BR5909RadarAuto6009Blumenau62070503***6304ABCD";

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível */
    }
  };

  return (
    <div className="pix-section">
      <div className="pay-label">
        <QrCode size={16} />
        Pague com Pix
      </div>

      <div className="pix-body">
        {/* QR Code placeholder — substituído pelo QR real do gateway. */}
        <div className="pix-qr" aria-hidden="true">
          <div className="pix-qr-grid">
            {Array.from({ length: 49 }).map((_, i) => (
              <span key={i} className={(i * 7 + (i % 5)) % 3 === 0 ? "on" : ""} />
            ))}
          </div>
          <div className="pix-qr-logo">
            <QrCode size={20} />
          </div>
        </div>

        <div className="pix-info">
          <ol className="pix-steps">
            <li>Abra o app do seu banco</li>
            <li>Escolha pagar via Pix com QR Code</li>
            <li>Escaneie o código ou use o copia-e-cola</li>
          </ol>
        </div>
      </div>

      <div className="pix-copy">
        <code className="pix-code">{pixCode}</code>
        <button type="button" className="pix-copy-btn" onClick={copy}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

/* ====================== Checkout inline ====================== */
function Checkout({ plan, onClose }: { plan: Plan; onClose: () => void }): JSX.Element {
  const [coupon, setCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [method, setMethod] = useState<"card" | "pix">("card");
  const [processing, setProcessing] = useState(false);

  const discount = coupon ? (plan.total * coupon.percent) / 100 : 0;
  const finalTotal = plan.total - discount;

  const onPay = (): void => {
    setProcessing(true);
    // TODO(checkout): criar PaymentIntent/Subscription no Stripe (cartão) ou
    // cobrança Pix no gateway, com plan + cupom + método.
    setTimeout(() => setProcessing(false), 1400);
  };

  return (
    <div className="checkout">
      <div className="checkout-head">
        <div>
          <div className="checkout-eyebrow">Você está assinando</div>
          <div className="checkout-plan">
            Plano {plan.name}
            {plan.savingsPercent !== null && (
              <span className="checkout-save">−{plan.savingsPercent}%</span>
            )}
          </div>
        </div>
        <button type="button" className="checkout-close" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
      </div>

      <CouponField
        onApply={(code, percent) => setCoupon(percent ? { code, percent } : null)}
        applied={coupon}
      />

      <div className="method-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={method === "card"}
          className={`method-tab${method === "card" ? " active" : ""}`}
          onClick={() => setMethod("card")}
        >
          <CreditCard size={16} />
          Cartão
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={method === "pix"}
          className={`method-tab${method === "pix" ? " active" : ""}`}
          onClick={() => setMethod("pix")}
        >
          <QrCode size={16} />
          Pix
        </button>
      </div>

      {method === "card" ? <PaymentSection /> : <PixSection amount={brl(finalTotal)} />}

      <div className="checkout-summary">
        <div className="checkout-line">
          <span>Plano {plan.name}</span>
          <span>R$ {brl(plan.total)}</span>
        </div>
        {coupon && (
          <div className="checkout-line checkout-line-discount">
            <span>Desconto ({coupon.code})</span>
            <span>− R$ {brl(discount)}</span>
          </div>
        )}
        <div className="checkout-line checkout-total">
          <span>Total{plan.cycleMonths > 1 ? ` (${plan.cycleMonths} meses)` : ""}</span>
          <span>R$ {brl(finalTotal)}</span>
        </div>
      </div>

      <button type="button" className="checkout-pay" onClick={onPay} disabled={processing}>
        {processing
          ? "Processando…"
          : method === "pix"
            ? `Gerar Pix de R$ ${brl(finalTotal)}`
            : `Pagar R$ ${brl(finalTotal)}`}
      </button>
    </div>
  );
}

/* ====================== Modal de checkout ====================== */
function CheckoutModal({ plan, onClose }: { plan: Plan; onClose: () => void }): JSX.Element {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="checkout-overlay" onMouseDown={onClose}>
      <div className="checkout-modal" onMouseDown={(e) => e.stopPropagation()}>
        <Checkout plan={plan} onClose={onClose} />
      </div>
    </div>
  );
}

/* ====================== Cards de planos (FREE) ====================== */
function PlanCards({
  onChoose,
  chosen,
}: {
  onChoose: (plan: Plan) => void;
  chosen: PlanId | null;
}): JSX.Element {
  return (
    <div className="plans-grid">
      {PLANS.map((plan) => {
        const isChosen = chosen === plan.id;
        return (
          <div
            key={plan.id}
            className={`plan-card${plan.highlight ? " featured" : ""}${isChosen ? " chosen" : ""}`}
          >
            {plan.highlight && (
              <div className="plan-ribbon">
                <Sparkles size={13} fill="currentColor" />
                Mais popular
              </div>
            )}

            <div className="plan-card-head">
              <span className="plan-name">{plan.name}</span>
              {plan.savingsPercent !== null && (
                <span className="plan-save">Economize {plan.savingsPercent}%</span>
              )}
            </div>

            <div className="plan-price">
              <span className="plan-price-currency">R$</span>
              <span className="plan-price-value">{brl(plan.perMonth)}</span>
              <span className="plan-price-cycle">/mês</span>
            </div>
            <div className="plan-billing-note">{plan.billingNote}</div>

            <button
              type="button"
              className={`plan-cta${plan.highlight ? " featured" : ""}`}
              onClick={() => onChoose(plan)}
            >
              {isChosen ? "Selecionado" : "Escolher plano"}
            </button>

            <ul className="plan-benefits">
              {BENEFITS.map((b) => (
                <li key={b}>
                  <Check size={16} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/* ====================== Painel premium ====================== */
function ActiveSubscription({
  cycle,
  status,
}: {
  cycle: SubscriptionCycle | null;
  status: SubscriptionStatus | null;
}): JSX.Element {
  const [showPlans, setShowPlans] = useState(false);
  const [chosen, setChosen] = useState<Plan | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const cycleLabel = cycle ? CYCLE_LABEL[cycle] : "Premium";
  const statusMeta = status ? STATUS_META[status] : STATUS_META.active;
  const plan = PLANS.find((p) => p.cycle === cycle);

  const doCancel = (): void => {
    setConfirmCancel(false);
    // TODO(billing): chamar cancelamento no Stripe.
  };

  return (
    <div className="sub-panel">
      <div className="sub-card">
        <div className="sub-card-top">
          <div className="sub-crown">
            <Crown size={24} fill="currentColor" />
          </div>
          <div className="sub-card-headings">
            <div className="sub-card-title">Você é Premium</div>
            <div className="sub-card-desc">Aproveite todos os recursos avançados do RadarAuto.</div>
          </div>
          <span className={`sub-status sub-status-${statusMeta.tone}`}>{statusMeta.label}</span>
        </div>

        <div className="sub-plan-row">
          <div className="sub-plan-info">
            <span className="sub-plan-label">Seu plano</span>
            <span className="sub-plan-name">{cycleLabel}</span>
          </div>
          {plan && (
            <div className="sub-plan-price">
              R$ {brl(plan.perMonth)}
              <span>/mês</span>
            </div>
          )}
        </div>

        {status === "cancelled" && (
          <div className="sub-note sub-note-warning">
            Sua assinatura foi cancelada e permanece ativa até o fim do período já pago.
          </div>
        )}
        {status === "past_due" && (
          <div className="sub-note sub-note-danger">
            Há um pagamento pendente. Atualize sua forma de pagamento para manter o Premium.
          </div>
        )}

        <div className="sub-pay-row">
          <div className="sub-pay-card">
            <CreditCard size={18} />
            <div>
              <div className="sub-pay-num">•••• •••• •••• 4242</div>
              <div className="sub-pay-exp">Expira 12/28</div>
            </div>
          </div>
          <button type="button" className="sub-pay-change">
            Trocar
          </button>
        </div>

        <ul className="sub-benefits">
          {BENEFITS.map((b) => (
            <li key={b}>
              <Check size={16} />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="sub-actions">
          <button
            type="button"
            className="sub-btn-secondary"
            onClick={() => setShowPlans((v) => !v)}
          >
            {showPlans ? "Ocultar planos" : "Trocar de plano"}
          </button>
          <button
            type="button"
            className="sub-btn-danger"
            onClick={() => setConfirmCancel(true)}
            disabled={status === "cancelled"}
          >
            Cancelar assinatura
          </button>
        </div>
      </div>

      {showPlans && (
        <div className="sub-change-plans">
          <div className="sub-change-label">Escolha um novo plano</div>
          <PlanCards onChoose={setChosen} chosen={chosen?.id ?? null} />
          {chosen && <CheckoutModal plan={chosen} onClose={() => setChosen(null)} />}
        </div>
      )}

      <ConfirmModal
        open={confirmCancel}
        title="Cancelar assinatura Premium?"
        description="Você perderá o contato direto com leads, o catálogo sem desfoque e os insights. Sua assinatura permanece ativa até o fim do período já pago."
        confirmLabel="Sim, cancelar"
        cancelLabel="Manter Premium"
        variant="danger"
        onConfirm={doCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}

/* ====================== Página ====================== */
export default function PlanosPage(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan === "premium";
  const [chosen, setChosen] = useState<Plan | null>(null);

  return (
    <div className="page-wrap plans-page">
      {isPremium ? (
        <ActiveSubscription
          cycle={user?.subscriptionCycle ?? null}
          status={user?.subscriptionStatus ?? null}
        />
      ) : (
        <>
          <PlanCards onChoose={setChosen} chosen={chosen?.id ?? null} />
          {chosen && <CheckoutModal plan={chosen} onClose={() => setChosen(null)} />}
        </>
      )}
    </div>
  );
}
