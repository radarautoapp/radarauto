/**
 * lib/stores-api.ts
 */
import type { GetMyStoreResponse, UpdateStoreRequest, UpdateStoreResponse } from "@radar/types";

import { apiFetch } from "./api";

export const storesApi = {
  async getMine(): Promise<GetMyStoreResponse> {
    return apiFetch<GetMyStoreResponse>("/stores/me", { method: "GET" });
  },

  async updateMine(body: UpdateStoreRequest): Promise<UpdateStoreResponse> {
    return apiFetch<UpdateStoreResponse>("/stores/me", {
      method: "PATCH",
      body,
    });
  },
};
