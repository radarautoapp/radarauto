/**
 * Plan / Subscription types
 *
 * Catálogo de planos do RadarAuto. Single source of truth.
 */

export interface PlanFeatures {
  viewContact: boolean;
  unlimitedFavorites: boolean;
  opportunityRadar: boolean;
  priorityListing: boolean;
  analytics: boolean;
}

export interface PlanCatalog {
  id: "free" | "premium_monthly" | "premium_quarterly" | "premium_yearly";
  name: string;
  price: number;
  cycle: "free" | "monthly" | "quarterly" | "yearly";
  features: PlanFeatures;
}
