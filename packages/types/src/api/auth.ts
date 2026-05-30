/**
 * Auth DTOs
 *
 * Cadastro público exige verificação dupla (email + phone) + CPF.
 */
import type { User } from "../domain/user.js";

export interface RegisterRevendedorRequest {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  password: string;
  emailVerificationToken: string;
  phoneVerificationToken: string;
}

export interface RegisterLojistaRequest {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  password: string;
  cnpj: string;
  emailVerificationToken: string;
  phoneVerificationToken: string;
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

export interface CheckEmailRequest {
  email: string;
}

export interface CheckCpfRequest {
  cpf: string;
}

export interface AvailabilityResponse {
  available: boolean;
}
