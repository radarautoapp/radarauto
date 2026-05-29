/**
 * Auth DTOs — contratos request/response da autenticação.
 * Compartilhado api↔web. Frontend usa pra tipar fetch/forms.
 */
import type { User } from "../domain/user.js";

export interface RegisterRevendedorRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterLojistaRequest {
  name: string;
  email: string;
  password: string;
  storeName: string;
  storePhone: string;
  storeCity: string;
  storeState: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceLabel?: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
  sessionId: string;
}

export interface MeResponse {
  user: User;
  session: {
    id: string;
    expiresAt: string;
  };
}
