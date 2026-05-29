/**
 * User domain types
 *
 * Propósito: tipos de usuário compartilhados api↔web.
 * Regras: roles definem permissões (Regra 10), plan define paywall (Regra 8).
 */

export type UserRole = "lojista" | "funcionario" | "revendedor" | "admin";

export type Plan = "free" | "premium";

export type SubscriptionCycle = "monthly" | "quarterly" | "yearly";

export type SubscriptionStatus = "active" | "cancelled" | "past_due" | "trialing";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: Plan;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionCycle: SubscriptionCycle | null;
  storeId: string | null; // null para revendedor/admin
  createdAt: string;
  updatedAt: string;
}
