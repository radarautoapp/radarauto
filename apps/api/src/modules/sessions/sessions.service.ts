/**
 * SessionsService
 *
 * Gestão de sessões do user autenticado:
 *  - listar próprias sessões ativas
 *  - revogar uma específica
 *  - revogar todas exceto a atual
 *
 * Segurança:
 *  - Sempre filtra por userId pra impedir revogar sessão alheia
 *  - Throw NotFound se o id não pertence ao user
 */
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Session } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

export interface PublicSession {
  id: string;
  createdAt: Date;
  lastSeenAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  isCurrent: boolean;
}

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listForUser(
    userId: string,
    currentSessionId: string,
  ): Promise<{ sessions: PublicSession[]; currentSessionId: string }> {
    const rows = await this.prisma.session.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastSeenAt: "desc" },
    });

    const sessions = rows.map((s) => this.toPublic(s, currentSessionId));
    return { sessions, currentSessionId };
  }

  async revoke(userId: string, targetSessionId: string): Promise<{ revoked: true }> {
    const session = await this.prisma.session.findFirst({
      where: { id: targetSessionId, userId, revokedAt: null },
    });
    if (!session) {
      throw new NotFoundException({
        code: "SESSION_NOT_FOUND",
        message: "Sessão não encontrada ou já revogada.",
      });
    }
    await this.prisma.session.update({
      where: { id: targetSessionId },
      data: { revokedAt: new Date() },
    });
    this.logger.log({ msg: "session.revoked", userId, sessionId: targetSessionId });
    return { revoked: true };
  }

  async revokeOthers(userId: string, currentSessionId: string): Promise<{ revokedCount: number }> {
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
        id: { not: currentSessionId },
      },
      data: { revokedAt: new Date() },
    });
    this.logger.log({
      msg: "session.revokedOthers",
      userId,
      revokedCount: result.count,
    });
    return { revokedCount: result.count };
  }

  private toPublic(s: Session, currentSessionId: string): PublicSession {
    return {
      id: s.id,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      isCurrent: s.id === currentSessionId,
    };
  }
}
