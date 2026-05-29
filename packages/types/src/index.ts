/**
 * @radar/types
 *
 * Propósito: tipos de domínio compartilhados entre frontend (web) e backend (api).
 * Garante contrato único — DTOs do backend ↔ consumers do frontend.
 *
 * Regra 26: TypeScript strict. Sem `any`.
 *
 * Convenção: tipos de domínio aqui. Tipos de UI ficam em @radar/ui.
 * Tipos de banco (entidades Prisma) NÃO vivem aqui — ficam encapsulados na api.
 */
export * from "./domain/user.js";
export * from "./domain/vehicle.js";
export * from "./domain/listing.js";
export * from "./domain/lead.js";
export * from "./domain/store.js";
export * from "./domain/plan.js";
export * from "./api/error.js";
export * from "./api/pagination.js";
