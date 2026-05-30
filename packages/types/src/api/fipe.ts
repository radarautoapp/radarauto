/**
 * FIPE — tipos normalizados (frontend ↔ backend).
 *
 * Cada provider (BrasilAPI, Parallelum) tem seu próprio formato;
 * o service normaliza pra estas interfaces.
 */

export interface FipeBrand {
  /** Código da marca no provider (string pra compatibilidade) */
  code: string;
  name: string;
}

export interface FipeModel {
  code: string;
  name: string;
}

export interface FipeYear {
  /** Ex: "2022-1" (ano + tipo combustível no padrão FIPE) */
  code: string;
  name: string;
}

export interface FipePrice {
  /** Valor em centavos pra evitar float */
  priceCents: number;
  /** Valor formatado original (ex: "R$ 198.000,00") */
  priceLabel: string;
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
  fipeCode: string;
  referenceMonth: string;
}

export interface ListFipeBrandsResponse {
  brands: FipeBrand[];
}
export interface ListFipeModelsResponse {
  models: FipeModel[];
}
export interface ListFipeYearsResponse {
  years: FipeYear[];
}
export interface GetFipePriceResponse {
  price: FipePrice;
}
