/**
 * lib/sessions-api.ts
 */
import type {
  ListSessionsResponse,
  RevokeOthersResponse,
  RevokeSessionResponse,
} from "@radar/types";

import { apiFetch } from "./api";

export const sessionsApi = {
  async list(): Promise<ListSessionsResponse> {
    return apiFetch<ListSessionsResponse>("/sessions", { method: "GET" });
  },

  async revoke(id: string): Promise<RevokeSessionResponse> {
    return apiFetch<RevokeSessionResponse>(`/sessions/${id}`, {
      method: "DELETE",
    });
  },

  async revokeOthers(): Promise<RevokeOthersResponse> {
    return apiFetch<RevokeOthersResponse>("/sessions/others", {
      method: "DELETE",
    });
  },
};
