/**
 * LastSeenInterceptor
 *
 * Atualiza Session.lastSeenAt a cada request autenticada.
 *
 * Otimização: throttle interno de 60 segundos por sessão.
 * Em memória, não persiste — se o servidor reinicia, perde o cache (OK).
 *
 * Não bloqueia a resposta (fire-and-forget). Falhas são logadas mas não
 * derrubam a request.
 */
import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";

import { PrismaService } from "../../prisma/prisma.service";

const THROTTLE_MS = 60_000;

@Injectable()
export class LastSeenInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LastSeenInterceptor.name);
  private readonly lastUpdated = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ user?: { sessionId?: string } }>();
    const sessionId = req.user?.sessionId;

    if (sessionId) this.touch(sessionId);

    return next.handle().pipe(tap());
  }

  private touch(sessionId: string): void {
    const last = this.lastUpdated.get(sessionId);
    const now = Date.now();
    if (last && now - last < THROTTLE_MS) return;

    this.lastUpdated.set(sessionId, now);
    void this.prisma.session
      .update({
        where: { id: sessionId },
        data: { lastSeenAt: new Date(now) },
      })
      .catch((err: unknown) => {
        // sessao deletada/revogada → ignora (next request vai cair em 401)
        this.logger.debug({
          msg: "session.lastSeen.update.failed",
          sessionId,
          error: err instanceof Error ? err.message : "unknown",
        });
      });
  }
}
