/**
 * lib/fipe-api.ts
 */
import type {
  GetFipePriceResponse,
  ListFipeModelsResponse,
  ListFipeYearsResponse,
} from "@radar/types";

import { apiFetch } from "./api";

export const fipeApi = {
  async models(brandCode: string): Promise<ListFipeModelsResponse> {
    return apiFetch<ListFipeModelsResponse>(
      `/fipe/marcas/${encodeURIComponent(brandCode)}/modelos`,
      { method: "GET" },
    );
  },

  async years(brandCode: string, modelCode: string): Promise<ListFipeYearsResponse> {
    return apiFetch<ListFipeYearsResponse>(
      `/fipe/marcas/${encodeURIComponent(brandCode)}/modelos/${encodeURIComponent(modelCode)}/anos`,
      { method: "GET" },
    );
  },

  async price(
    brandCode: string,
    modelCode: string,
    yearCode: string,
  ): Promise<GetFipePriceResponse> {
    return apiFetch<GetFipePriceResponse>(
      `/fipe/marcas/${encodeURIComponent(brandCode)}/modelos/${encodeURIComponent(modelCode)}/anos/${encodeURIComponent(yearCode)}/preco`,
      { method: "GET" },
    );
  },
};
