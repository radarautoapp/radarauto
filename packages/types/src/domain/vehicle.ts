/**
 * Vehicle domain types
 *
 * Propósito: tipos do recurso central do sistema. Compartilhado api↔web.
 *
 * Importante: campos de PII/contato (phone, whatsapp, email) NÃO ficam aqui —
 * ficam em Store, e a API filtra por paywall (Regra 8).
 */

export type Fuel = "Gasolina" | "Flex" | "Diesel" | "Elétrico" | "Híbrido";

export type Transmission = "Manual" | "Automático" | "Automatizado" | "CVT";

export type Category = "Hatch" | "Sedan" | "SUV" | "Caminhonete" | "Picape" | "Utilitário";

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  yearModel: number;
  km: number;
  fuel: Fuel;
  transm: Transmission;
  color: string;
  colorHex: string;
  plate: string | null;
  category: Category;
  price: number;
  fipe: number;
  diff: number; // percentual em relação à FIPE
  city: string;
  state: string;
  optionals: string[];
  obs: string;
  photos: string[]; // URLs
  delivery: boolean;
  storeId: string;
  createdAt: string;
  updatedAt: string;
}
