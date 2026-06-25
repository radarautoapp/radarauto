/**
 * SubscriptionExpiryService — encerra trials Premium expirados.
 *
 * Roda periodicamente e rebaixa para free os usuários em trial cujo
 * subscriptionExpiresAt já passou. Quando o billing real (Stripe) entrar, este
 * mesmo job pode tratar assinaturas pagas vencidas/não renovadas.
 */
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Plan, SubscriptionStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SubscriptionExpiryService {
  private readonly logger = new Logger(SubscriptionExpiryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** A cada hora, rebaixa para free os trials Premium que expiraram. */
  @Cron(CronExpression.EVERY_HOUR)
  async expireTrials(): Promise<void> {
    const now = new Date();
    const result = await this.prisma.user.updateMany({
      where: {
        plan: Plan.premium,
        subscriptionStatus: SubscriptionStatus.trialing,
        subscriptionExpiresAt: { not: null, lt: now },
      },
      data: {
        plan: Plan.free,
        subscriptionStatus: null,
        subscriptionCycle: null,
        subscriptionExpiresAt: null,
      },
    });

    if (result.count > 0) {
      this.logger.log({ msg: "trials.expired", count: result.count });
    }
  }
}
