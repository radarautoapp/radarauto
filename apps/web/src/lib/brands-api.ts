/**
 * lib/brands-api.ts
 */
import type { ListBrandsResponse } from "@radar/types";

import { apiFetch } from "./api";

export const brandsApi = {
  /** Sem q: marcas com logo (grid). Com q: busca todas (inclui sem logo). */
  async list(q?: string): Promise<ListBrandsResponse> {
    const path = q && q.trim() ? `/brands?q=${encodeURIComponent(q.trim())}` : "/brands";
    return apiFetch<ListBrandsResponse>(path, { method: "GET" });
  },
};
