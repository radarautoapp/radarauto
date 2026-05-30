/**
 * lib/pricing-api.ts
 */
import type { RecommendPriceRequest, RecommendPriceResponse } from "@radar/types";

import { apiFetch } from "./api";

export const pricingApi = {
  async recommend(body: RecommendPriceRequest): Promise<RecommendPriceResponse> {
    return apiFetch<RecommendPriceResponse>("/pricing/recommend", {
      method: "POST",
      body,
    });
  },
};
