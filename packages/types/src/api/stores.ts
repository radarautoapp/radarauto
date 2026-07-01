/**
 * Store DTOs (frontend ↔ backend).
 */

export interface PublicStore {
  id: string;
  name: string;
  initials: string;
  cnpj: string;
  legalName: string | null;
  tradeName: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  city: string;
  state: string;
  since: number;
  rating: number;
  reviews: number;
  verified: boolean;
  description: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetMyStoreResponse {
  store: PublicStore;
}

export interface UpdateStoreRequest {
  name?: string;
  phone?: string;
  phoneVerificationToken?: string;
  whatsapp?: string;
  whatsappVerificationToken?: string;
  email?: string;
  description?: string;
}

export interface UpdateStoreResponse {
  store: PublicStore;
}

export interface UploadStoreLogoResponse {
  store: PublicStore;
}

export interface RemoveStoreLogoResponse {
  store: PublicStore;
}

export interface AdminStoreItem {
  id: string;
  name: string;
  cnpj: string;
  city: string;
  state: string;
  sellingStatus: "NONE" | "PENDING" | "APPROVED";
  createdAt: string;
  ownerEmail: string | null;
  ownerName: string | null;
  logoUrl: string | null;
}

export interface ListStoresForAdminResponse {
  stores: AdminStoreItem[];
}

export interface SetSellingStatusRequest {
  approved: boolean;
}

export interface AdminOverview {
  storesTotal: number;
  storesApproved: number;
  storesPending: number;
  vehiclesActive: number;
  vehiclesNew7d: number;
  buyersTotal: number;
  buyersNew7d: number;
  leadsTotal: number;
  leadsNew7d: number;
  soldTotal: number;
  soldThisMonth: number;
  avgDiscountPercent: number | null;
  growth: Array<{ date: string; stores: number; vehicles: number; leads: number }>;
  topStores: Array<{ id: string; name: string; activeVehicles: number }>;
  byState: Array<{ state: string; stores: number; vehicles: number }>;
  leadFunnel: { hot: number; warm: number; cold: number };
  mrrEstimateCents: number;
  activeSubscribers: number;
  mrrTrend: Array<{ weekStart: string; newSubscribers: number }>;
}
