/**
 * lib/users-api.ts
 *
 * Endpoints de gestão do próprio perfil.
 */
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  UpdateProfileRequest,
} from "@radar/types";
import type { User } from "@radar/types";

import { apiFetch } from "./api";

export const usersApi = {
  async updateProfile(body: UpdateProfileRequest): Promise<{ user: User }> {
    return apiFetch<{ user: User }>("/users/me", {
      method: "PATCH",
      body,
    });
  },

  async changePassword(body: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    return apiFetch<ChangePasswordResponse>("/users/me/password", {
      method: "PATCH",
      body,
    });
  },
};
