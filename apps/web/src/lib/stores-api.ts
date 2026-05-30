/**
 * lib/stores-api.ts
 */
import type {
  GetMyStoreResponse,
  RemoveStoreLogoResponse,
  UpdateStoreRequest,
  UpdateStoreResponse,
  UploadStoreLogoResponse,
} from "@radar/types";

import { apiFetch, tokenStorage } from "./api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

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

  /**
   * Upload de logo (multipart). Não usa apiFetch porque precisa de FormData
   * (apiFetch sempre serializa body como JSON).
   */
  async uploadLogo(file: Blob, filename = "logo.jpg"): Promise<UploadStoreLogoResponse> {
    const form = new FormData();
    form.append("file", file, filename);

    const token = tokenStorage.get();
    const res = await fetch(`${API_BASE}/stores/me/logo`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    if (!res.ok) {
      let body: { code?: string; message?: string } = {};
      try {
        body = await res.json();
      } catch {
        // ignore
      }
      const { ApiClientError } = await import("./api");
      throw new ApiClientError(
        body.code ?? "UNKNOWN_ERROR",
        body.message ?? "Falha no upload.",
        res.status,
      );
    }

    return (await res.json()) as UploadStoreLogoResponse;
  },

  async removeLogo(): Promise<RemoveStoreLogoResponse> {
    return apiFetch<RemoveStoreLogoResponse>("/stores/me/logo", { method: "DELETE" });
  },
};
