/**
 * API Error contract (Regra 28)
 *
 * Formato único de erro em toda resposta da API.
 * Frontend usa pra renderizar feedback consistente.
 */

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Códigos de erro conhecidos — referencia central
export const ErrorCodes = {
  // Auth
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",

  // Validation
  VALIDATION_FAILED: "VALIDATION_FAILED",

  // Resources
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",

  // Business rules
  INVALID_TRANSITION: "INVALID_TRANSITION",
  PLAN_REQUIRED: "PLAN_REQUIRED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",

  // System
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
