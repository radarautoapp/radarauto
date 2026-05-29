/**
 * RoleGuard
 *
 * Restringe rota a roles específicas. Use junto com @Roles().
 *
 * Exemplo:
 *   @UseGuards(JwtAuthGuard, RoleGuard)
 *   @Roles("lojista", "admin")
 *   @Post("funcionarios") create() { ... }
 */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";

import { ROLES_KEY } from "../decorators/roles.decorator";
import { AuthenticatedRequestUser } from "../../modules/auth/jwt.strategy";

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<{ user?: AuthenticatedRequestUser }>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Sem permissão para acessar este recurso.",
      });
    }
    if (!required.includes(user.role)) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Seu perfil não tem permissão para esta ação.",
      });
    }
    return true;
  }
}
