/**
 * JwtStrategy
 *
 * Propósito: extrai e valida JWT do header Authorization.
 * Após decodificar, consulta o banco pra validar a sessão (Regra 7).
 * Token expirado, sessão revogada ou user desativado = 401.
 */
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { AuthService, AuthTokenPayload, SafeUser } from "./auth.service";

export interface AuthenticatedRequestUser extends SafeUser {
  sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_SECRET"),
    });
  }

  async validate(payload: AuthTokenPayload): Promise<AuthenticatedRequestUser> {
    if (!payload.sub || !payload.sid) {
      throw new UnauthorizedException({
        code: "SESSION_INVALID",
        message: "Token malformado.",
      });
    }
    const user = await this.authService.validateSession(payload.sub, payload.sid);
    return { ...user, sessionId: payload.sid };
  }
}
