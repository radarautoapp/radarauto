/**
 * User self-service DTOs.
 *
 * Cobrem operações no perfil do user autenticado.
 */

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  phoneVerificationToken?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  revokedSessions: number;
}
