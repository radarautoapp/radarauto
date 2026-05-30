/**
 * Verification types
 *
 * Suporta dois canais: email e phone.
 * Endpoints e payloads compartilham a mesma estrutura, mudando só o channel
 * e o nome do target (email ou phone).
 */

export type VerificationChannel = "email" | "phone";

export interface SendPhoneVerificationRequest {
  phone: string;
}

export interface SendEmailVerificationRequest {
  email: string;
}

export interface SendVerificationResponse {
  expiresAt: string;
  cooldownSeconds: number;
  attemptsRemaining: number;
}

export interface ConfirmPhoneVerificationRequest {
  phone: string;
  code: string;
}

export interface ConfirmEmailVerificationRequest {
  email: string;
  code: string;
}

export interface ConfirmVerificationResponse {
  verificationToken: string;
  expiresAt: string;
}

export interface LastCodeDevResponse {
  code: string;
  expiresAt: string;
}
