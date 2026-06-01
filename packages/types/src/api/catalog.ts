/**
 * Tipos do catálogo público (vitrine de veículos ACTIVE de todas as lojas).
 *
 * O catálogo é só leitura/descoberta: filtros, ordenação e paginação
 * enumerada. Difere de "meus veículos" (gestão da própria loja).
 */

/** Opções de ordenação do catálogo. NUNCA ordenar só por created_at. */
export type CatalogSort = "relevance" | "price_asc" | "price_desc" | "recent";

/** Filtros aceitos pelo catálogo. Todos opcionais. */
export interface CatalogFilters {
  q?: string;
  brand?: string;
  category?: string;
  city?: string;
  state?: string;
  fuel?: string;
  color?: string;
  priceMin?: number; // centavos
  priceMax?: number; // centavos
  yearMin?: number;
  yearMax?: number;
  kmMax?: number;
  delivery?: boolean;
  /** Só oportunidades: 20%+ abaixo da FIPE. */
  opportunitiesOnly?: boolean;
  /** Opcionais exigidos (todos precisam estar presentes). */
  optionals?: string[];
}

/** Query completa: filtros + ordenação + paginação. */
export interface CatalogQuery extends CatalogFilters {
  sort?: CatalogSort;
  page?: number; // 1-based
  pageSize?: number; // default 40
}

/** Um item do catálogo (card). */
export interface CatalogItem {
  id: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  km: number;
  fuel: string;
  color: string;
  colorHex: string | null;
  category: string;
  city: string;
  state: string;
  price: number; // centavos
  fipe: number; // centavos
  /** % de diferença vs FIPE (negativo = abaixo da FIPE). Ex.: -38. */
  diff: number;
  delivery: boolean;
  coverPhoto: string | null;
  photoCount: number;
  rankingScore: number;
  views: number;
  storeId: string;
  storeName: string;
  /** True se o card está bloqueado para o plano atual (free). */
  locked: boolean;
}

/** Faceta de marca (para o filtro de marcas com contagem). */
export interface CatalogBrandFacet {
  brand: string;
  count: number;
}

/** Resposta paginada do catálogo. */
export interface CatalogResponse {
  items: CatalogItem[];
  /** True se o usuário tem acesso premium (vê tudo). */
  premium: boolean;
  /** Quantos itens estão bloqueados (free). */
  lockedCount: number;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** Facetas para alimentar os filtros dinamicamente. */
  facets: {
    brands: CatalogBrandFacet[];
    categories: string[];
    fuels: string[];
    cities: string[];
    colors: { name: string; hex: string | null }[];
    optionals: string[];
  };
  /** Oportunidades (15%+ abaixo da FIPE), top por desconto. Independe da página. */
  opportunities: CatalogItem[];
}
