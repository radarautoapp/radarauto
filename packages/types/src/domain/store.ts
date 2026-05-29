/**
 * Store domain types
 *
 * Propósito: loja/concessionária. Contém dados de contato sensíveis.
 *
 * IMPORTANTE: campos phone/whatsapp/email só vêm na API se
 * canViewContact=true (Regra 8). Frontend nunca decide isso.
 */

export interface StorePublic {
  id: string;
  name: string;
  initials: string;
  city: string;
  state: string;
  since: number;
  rating: number;
  reviews: number;
  verified: boolean;
  description: string;
  logoUrl: string | null;
}

export interface StoreWithContact extends StorePublic {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  canViewContact: boolean; // flag pro frontend renderizar UI
}
