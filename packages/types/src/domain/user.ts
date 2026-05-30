/**
 * User domain types
 *
 * Tipos de usuário compartilhados api↔web.
 * Roles definem permissões (Regra 10), plan define paywall (Regra 8).
 */

export type UserRole = "lojista" | "funcionario" | "revendedor" | "admin";

export type Plan = "free" | "premium";

export type SubscriptionCycle = "monthly" | "quarterly" | "yearly";

export type SubscriptionStatus = "active" | "cancelled" | "past_due" | "trialing";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  cpf: string | null;
  role: UserRole;
  plan: Plan;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionCycle: SubscriptionCycle | null;
  storeId: string | null;
  createdAt: string;
  updatedAt: string;
}
