/**
 * @radar/types
 *
 * Tipos de domínio compartilhados entre frontend (web) e backend (api).
 * Garante contrato único — DTOs do backend ↔ consumers do frontend.
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
export * from "./api/cnpj.js";
export * from "./api/verification.js";
export * from "./api/users.js";
export * from "./api/sessions.js";
export * from "./api/stores.js";
