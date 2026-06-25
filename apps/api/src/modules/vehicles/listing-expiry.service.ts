/**
 * ListingExpiryService — pausa anúncios cuja janela de 24h expirou.
 *
 * Roda periodicamente (cron) e move para INACTIVE todo Listing ACTIVE com
 * expiresAt no passado. O lojista reativa manualmente para ganhar nova janela.
 */
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ListingExpiryService {
  private readonly logger = new Logger(ListingExpiryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** A cada 10 minutos, pausa os anúncios ativos que expiraram. */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async expireListings(): Promise<void> {
    const now = new Date();
    const result = await this.prisma.listing.updateMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        expiresAt: { not: null, lt: now },
      },
      data: { status: "INACTIVE" },
    });

    if (result.count > 0) {
      this.logger.log({ msg: "listings.expired", count: result.count });
    }
  }
}
