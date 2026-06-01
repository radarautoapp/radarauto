/**
 * recompute-ranking.ts — recalcula o Radar Score de todos os anúncios.
 *
 * Uso: rodar uma vez após mudar a fórmula de ranking.
 *   pnpm --filter @radar/api exec ts-node src/scripts/recompute-ranking.ts
 * (ou via tsx; ver instrução no apply)
 *
 * Lê todos os Vehicle + Listing, calcula com a fórmula atual e salva.
 */
import { PrismaClient } from "@prisma/client";

import { computeRankingScore } from "../common/ranking";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const vehicles = await prisma.vehicle.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      price: true,
      fipe: true,
      photos: true,
      obs: true,
      year: true,
      km: true,
      listing: {
        select: { id: true, views: true, favorites: true, publishedAt: true },
      },
    },
  });

  let updated = 0;
  for (const v of vehicles) {
    if (!v.listing) continue;
    const score = computeRankingScore({
      price: v.price,
      fipe: v.fipe,
      views: v.listing.views,
      favorites: v.listing.favorites,
      photoCount: v.photos.length,
      hasObs: !!v.obs,
      year: v.year,
      km: v.km,
      publishedAt: v.listing.publishedAt,
    });
    await prisma.listing.update({
      where: { id: v.listing.id },
      data: { rankingScore: score },
    });
    updated++;
  }

  console.log(`Radar Score recalculado para ${updated} anúncios.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
