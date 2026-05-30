/**
 * Brand — tipos compartilhados.
 */

export interface Brand {
  id: string;
  fipeCode: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  logoFormat: string | null;
  popular: boolean;
  order: number;
}

export interface ListBrandsResponse {
  brands: Brand[];
}
