/**
 * promo.ts — promoção de trial Premium no cadastro.
 *
 * Enquanto o gateway de pagamento (Stripe) não está em produção, novos cadastros
 * ganham PROMO_TRIAL_MONTHS meses de Premium em modo "trialing". Ao fim do
 * período, um job rebaixa a conta para free.
 *
 * Para encerrar a promoção (quando o Stripe entrar), basta definir
 * PROMO_TRIAL_ENABLED = false — novos cadastros voltam a nascer free.
 */
import { Plan, SubscriptionCycle, SubscriptionStatus } from "@prisma/client";

/** Liga/desliga o brinde de Premium no cadastro. */
export const PROMO_TRIAL_ENABLED = true;

/** Duração do trial promocional, em meses. */
export const PROMO_TRIAL_MONTHS = 3;

/** Campos de assinatura aplicados na criação do usuário. */
export interface SubscriptionSeed {
  plan: Plan;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionCycle: SubscriptionCycle | null;
  subscriptionExpiresAt: Date | null;
}

/** Soma `months` meses a uma data (lida com viradas de ano). */
function addMonths(from: Date, months: number): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Retorna os campos de assinatura para um novo cadastro. Com a promoção ligada,
 * nasce Premium em trial por PROMO_TRIAL_MONTHS meses; senão, free.
 */
export function newUserSubscription(now: Date = new Date()): SubscriptionSeed {
  if (!PROMO_TRIAL_ENABLED) {
    return {
      plan: Plan.free,
      subscriptionStatus: null,
      subscriptionCycle: null,
      subscriptionExpiresAt: null,
    };
  }
  return {
    plan: Plan.premium,
    subscriptionStatus: SubscriptionStatus.trialing,
    subscriptionCycle: SubscriptionCycle.quarterly,
    subscriptionExpiresAt: addMonths(now, PROMO_TRIAL_MONTHS),
  };
}
