/**
 * Listing domain types
 *
 * Propósito: representa o anúncio em si (não o veículo).
 * Lifecycle obrigatório (Regra 29). NUNCA deletar fisicamente.
 */

export type ListingStatus =
  | "DRAFT"
  | "PENDING" // criado por funcionario, aguardando aprovação do lojista
  | "ACTIVE"
  | "INACTIVE" // pausado pelo lojista
  | "EXPIRED" // ciclo de 90 dias terminou
  | "SOLD"
  | "BLOCKED"; // admin baniu

export interface Listing {
  id: string;
  vehicleId: string;
  status: ListingStatus;
  createdBy: string; // userId
  approvedBy: string | null;
  approvedAt: string | null;
  expiresAt: string | null;
  publishedAt: string | null;
  soldAt: string | null;
  views: number;
  favorites: number;
  rankingScore: number; // 0-100, calculado pelo backend
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null; // soft-delete
}
