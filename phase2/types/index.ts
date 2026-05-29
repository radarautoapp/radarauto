/**
 * @radar/types
 *
 * Propósito: tipos de domínio compartilhados entre frontend (web) e backend (api).
 * Garante contrato único — DTOs do backend ↔ consumers do frontend.
 *
 * Regra 26: TypeScript strict. Sem `any`.
 */
export * from "./domain/user.js";
export * from "./domain/vehicle.js";
export * from "./domain/listing.js";
export * from "./domain/lead.js";
export * from "./domain/store.js";
export * from "./domain/plan.js";
export * from "./domain/session.js";
export * from "./api/error.js";
export * from "./api/pagination.js";
export * from "./api/auth.js";
