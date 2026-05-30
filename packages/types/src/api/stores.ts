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
