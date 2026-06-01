/**
 * catalog-api.ts — cliente do catálogo público.
 *
 * Monta a query string a partir dos filtros/sort/paginação e chama
 * GET /catalog. detail() busca um veículo por id (GET /catalog/:id).
 * Usa apiFetch (JSON autenticado).
 */
import type { CatalogQuery, CatalogResponse, VehicleDetailResponse } from "@radar/types";

import { apiFetch } from "@/lib/api";

function buildQueryString(query: CatalogQuery): string {
  const p = new URLSearchParams();
  const add = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === "") return;
    p.set(key, String(value));
  };

  add("q", query.q);
  add("brand", query.brand);
  add("category", query.category);
  add("city", query.city);
  add("state", query.state);
  add("fuel", query.fuel);
  add("color", query.color);
  add("priceMin", query.priceMin);
  add("priceMax", query.priceMax);
  add("yearMin", query.yearMin);
  add("yearMax", query.yearMax);
  add("kmMax", query.kmMax);
  if (query.delivery) p.set("delivery", "true");
  if (query.opportunitiesOnly) p.set("opportunitiesOnly", "true");
  if (query.optionals && query.optionals.length > 0) {
    p.set("optionals", query.optionals.join(","));
  }
  add("sort", query.sort);
  add("page", query.page);
  add("pageSize", query.pageSize);

  const s = p.toString();
  return s ? `?${s}` : "";
}

export const catalogApi = {
  list(query: CatalogQuery = {}): Promise<CatalogResponse> {
    return apiFetch<CatalogResponse>(`/catalog${buildQueryString(query)}`, {
      method: "GET",
    });
  },

  detail(id: string): Promise<VehicleDetailResponse> {
    return apiFetch<VehicleDetailResponse>(`/catalog/${id}`, { method: "GET" });
  },
};
