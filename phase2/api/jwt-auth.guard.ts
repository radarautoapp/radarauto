/**
 * JwtAuthGuard
 *
 * Guard global. Toda rota é protegida por padrão (Regra 10).
 * Rotas públicas precisam declarar @Public() explicitamente.
 */
import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";

import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(
    context: ExecutionContext,
  ): ReturnType<AuthGuard["prototype"]["canActivate"]> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  override handleRequest<TUser>(err: unknown, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Autenticação necessária.",
      });
    }
    return user;
  }
}
