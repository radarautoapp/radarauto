/**
 * Pricing — tipos do preço recomendado RadarAuto.
 */

export interface RecommendPriceRequest {
  fipeCents: number;
  brand: string;
  model: string;
  category: string;
  year: number;
  /** Opcionais do veículo sendo cadastrado (pra ponderar comparáveis) */
  optionals: string[];
}

export interface RecommendPriceResponse {
  /** Preço recomendado em centavos */
  priceCents: number;
  /** Diferença % em relação à FIPE (negativo = abaixo) */
  diffPercent: number;
  /** Fonte do cálculo: "comparables" | "default" */
  source: string;
  /** Quantos anúncios comparáveis foram usados */
  sampleSize: number;
}
