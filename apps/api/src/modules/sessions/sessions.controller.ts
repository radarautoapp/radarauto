/**
 * SessionsController
 *
 *   GET    /sessions              - listar próprias sessões ativas
 *   DELETE /sessions/:id          - revoga sessão específica
 *   DELETE /sessions/others       - revoga todas exceto a atual
 *
 * Todas requerem JWT. currentSessionId vem do payload.
 */
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { SafeUser } from "../auth/auth.service";
import { PublicSession, SessionsService } from "./sessions.service";

interface JwtRequest {
  user?: {
    id: string;
    sessionId: string;
  };
}

@Controller("sessions")
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Get()
  async list(
    @CurrentUser() user: SafeUser,
    @Req() req: JwtRequest,
  ): Promise<{ sessions: PublicSession[]; currentSessionId: string }> {
    const sid = req.user?.sessionId ?? "";
    return this.sessions.listForUser(user.id, sid);
  }

  @Delete("others")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async revokeOthers(
    @CurrentUser() user: SafeUser,
    @Req() req: JwtRequest,
  ): Promise<{ revokedCount: number }> {
    const sid = req.user?.sessionId ?? "";
    return this.sessions.revokeOthers(user.id, sid);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async revoke(@CurrentUser() user: SafeUser, @Param("id") id: string): Promise<{ revoked: true }> {
    return this.sessions.revoke(user.id, id);
  }
}
