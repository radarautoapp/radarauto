/**
 * @CurrentUser()
 *
 * Injeta o user autenticado direto no parâmetro do handler.
 * Disponível em rotas protegidas pelo JwtAuthGuard.
 */
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { AuthenticatedRequestUser } from "../../modules/auth/jwt.strategy";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedRequestUser => {
    const req = ctx.switchToHttp().getRequest<{ user: AuthenticatedRequestUser }>();
    return req.user;
  },
);
