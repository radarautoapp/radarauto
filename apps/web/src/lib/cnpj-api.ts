/**
 * lib/cnpj-api.ts
 *
 * Wrapper tipado pra GET /cnpj/:cnpj.
 */
import type { CnpjLookupResponse } from "@radar/types";

import { apiFetch } from "./api";

export const cnpjApi = {
  async lookup(cnpj: string): Promise<CnpjLookupResponse> {
    const clean = cnpj.replace(/\D/g, "");
    return apiFetch<CnpjLookupResponse>(`/cnpj/${clean}`, { skipAuth: true });
  },
};
