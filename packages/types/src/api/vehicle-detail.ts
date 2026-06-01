/**
 * Tipos do detalhe público de um veículo (/catalog/:id).
 *
 * Regra de ouro do paywall: o backend NÃO envia dado premium para FREE.
 * Os campos premium (vendedor, galeria completa, insights) são opcionais e
 * só vêm preenchidos quando o usuário tem plano premium. O blur no frontend
 * é apenas UX — o dado sensível nem chega ao cliente FREE.
 */

/** Dados do vendedor (loja). Só presentes para usuários premium. */
export interface VehicleSeller {
  name: string;
  initials: string;
  city: string;
  state: string;
  phone: string;
  whatsapp: string | null;
  since: number;
  rating: number;
  reviews: number;
  verified: boolean;
  logoUrl: string | null;
}

/** Insights do anúncio. Só presentes para premium. */
export interface VehicleInsights {
  views: number;
  rankingScore: number;
}

/** Um veículo similar (card horizontal na seção "Outras oportunidades"). */
export interface SimilarVehicle {
  id: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  km: number;
  price: number;
  fipe: number;
  diff: number;
  city: string;
  state: string;
  coverPhoto: string | null;
  /** True se bloqueado para o plano atual (free). */
  locked: boolean;
}

/** Detalhe completo do veículo. */
export interface VehicleDetail {
  id: string;
  storeId: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  yearModel: number;
  km: number;
  fuel: string;
  transm: string;
  color: string;
  colorHex: string | null;
  plate: string | null;
  category: string;
  price: number; // centavos
  fipe: number; // centavos
  diff: number; // % vs FIPE (negativo = abaixo)
  city: string;
  state: string;
  optionals: string[];
  obs: string | null;
  delivery: boolean;
  status: string;

  /** Galeria visível. Para FREE vem limitada (primeiras N fotos). */
  photos: string[];
  /** Total real de fotos do anúncio (para mostrar "+X bloqueadas"). */
  photoCount: number;

  /** True se o usuário tem acesso premium a este recurso. */
  premium: boolean;
  /** Limite de fotos no plano free (para o lock da galeria). */
  freePhotoLimit: number;

  /** Só preenchido quando premium. */
  seller: VehicleSeller | null;
  /** Só preenchido quando premium. */
  insights: VehicleInsights | null;

  similar: SimilarVehicle[];
}

export interface VehicleDetailResponse {
  vehicle: VehicleDetail;
}
