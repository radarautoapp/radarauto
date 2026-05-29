/**
 * @Public()
 *
 * Marca rota como pública (sem autenticação).
 * O JwtAuthGuard pula ela. Usado em /auth/login, /auth/register, /health.
 */
import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
