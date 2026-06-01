/**
 * Vehicles — tipos de listagem e gestão (meus-veículos).
 */

export type ListingStatusDto =
  | "DRAFT"
  | "PENDING"
  | "ACTIVE"
  | "INACTIVE"
  | "EXPIRED"
  | "SOLD"
  | "BLOCKED";

export interface VehicleListItem {
  id: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  yearModel: number;
  km: number;
  color: string;
  price: number; // centavos
  fipe: number; // centavos
  city: string;
  state: string;
  coverPhoto: string | null;
  photoCount: number;
  delivery: boolean;
  /** Status do anúncio */
  status: ListingStatusDto;
  views: number;
  favorites: number;
  /** Quem criou (nome) — útil pro lojista ver quem cadastrou */
  createdByName: string;
  /** Se o veículo aguarda aprovação do lojista */
  pendingApproval: boolean;
  createdAt: string;
}

export interface ListVehiclesResponse {
  vehicles: VehicleListItem[];
}

export interface ApproveVehicleResponse {
  id: string;
  status: ListingStatusDto;
}

export interface SetVehicleStatusResponse {
  status: ListingStatusDto;
}

export interface RemoveVehicleResponse {
  deleted: boolean;
}
