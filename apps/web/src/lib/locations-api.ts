/**
 * lib/locations-api.ts
 */
import type { ListCitiesResponse, ListStatesResponse } from "@radar/types";

import { apiFetch } from "./api";

export const locationsApi = {
  async states(): Promise<ListStatesResponse> {
    return apiFetch<ListStatesResponse>("/locations/states", { method: "GET" });
  },

  async cities(uf: string, q?: string): Promise<ListCitiesResponse> {
    const params = new URLSearchParams({ uf });
    if (q && q.trim()) params.set("q", q.trim());
    return apiFetch<ListCitiesResponse>(`/locations/cities?${params.toString()}`, {
      method: "GET",
    });
  },
};
