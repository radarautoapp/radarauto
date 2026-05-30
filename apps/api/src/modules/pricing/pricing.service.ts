/**
 * PricingService — engine de Preço Recomendado RadarAuto.
 *
 * Business logic (testável, sem dependência de framework além do Prisma).
 *
 * Estratégia v2 (baseada em dados reais da plataforma):
 *   1. Busca até 10 anúncios ATIVOS comparáveis: mesma marca + modelo,
 *      ano com tolerância de ±1, com preço e fipe > 0.
 *   2. Se < 3 comparáveis → fallback FIPE -10% (target RadarAuto).
 *   3. Se >= 3 → média PONDERADA dos preços, onde o peso de cada carro
 *      vem da similaridade de opcionais (índice de Jaccard) com o carro
 *      sendo cadastrado:
 *         similaridade = |opcionais em comum| / |união dos opcionais|
 *         peso = 0.5 + similaridade   (varia de 0.5 a 1.5)
 *      Carros com configuração parecida pesam mais na média.
 *
 * Enquanto não há volume de anúncios, cai no fallback (-10%),
 * ficando "esperto" automaticamente quando o catálogo crescer.
 */
import { Injectable } from "@nestjs/common";

import type { RecommendPriceResponse } from "@radar/types";

import { PrismaService } from "../../prisma/prisma.service";

const RADAR_TARGET_PERCENT = -10;
const MIN_COMPARABLES = 3;
const MAX_COMPARABLES = 10;
const YEAR_TOLERANCE = 1;

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async recommend(params: {
    fipeCents: number;
    brand: string;
    model: string;
    category: string;
    year: number;
    optionals: string[];
  }): Promise<RecommendPriceResponse> {
    const { fipeCents, brand, model, year, optionals } = params;

    if (!fipeCents || fipeCents <= 0) {
      return this.fallback(0);
    }

    // Comparáveis: mesma marca+modelo, ano ±1, ativos, com preço e fipe
    const comparables = await this.prisma.vehicle.findMany({
      where: {
        brand: { equals: brand, mode: "insensitive" },
        model: { equals: model, mode: "insensitive" },
        year: { gte: year - YEAR_TOLERANCE, lte: year + YEAR_TOLERANCE },
        fipe: { gt: 0 },
        price: { gt: 0 },
        deletedAt: null,
        listing: { status: "ACTIVE" },
      },
      select: { price: true, optionals: true },
      take: MAX_COMPARABLES,
    });

    if (comparables.length < MIN_COMPARABLES) {
      return this.fallback(fipeCents);
    }

    // Média ponderada por similaridade de opcionais (Jaccard)
    const target = new Set(optionals.map((o) => o.toLowerCase()));
    let weightedSum = 0;
    let weightTotal = 0;

    for (const c of comparables) {
      const comp = new Set((c.optionals ?? []).map((o) => o.toLowerCase()));
      const sim = jaccard(target, comp);
      const weight = 0.5 + sim; // 0.5 a 1.5
      weightedSum += c.price * weight;
      weightTotal += weight;
    }

    const avgPriceCents = weightTotal > 0 ? weightedSum / weightTotal : fipeCents;

    // Arredonda pra múltiplo de R$ 100
    const priceCents = Math.round(avgPriceCents / 10000) * 10000;
    const diffPercent = Math.round(((priceCents - fipeCents) / fipeCents) * 100);

    return {
      priceCents,
      diffPercent,
      source: "comparables",
      sampleSize: comparables.length,
    };
  }

  private fallback(fipeCents: number): RecommendPriceResponse {
    if (fipeCents <= 0) {
      return {
        priceCents: 0,
        diffPercent: RADAR_TARGET_PERCENT,
        source: "default",
        sampleSize: 0,
      };
    }
    const raw = fipeCents * (1 + RADAR_TARGET_PERCENT / 100);
    const priceCents = Math.round(raw / 10000) * 10000;
    return {
      priceCents,
      diffPercent: RADAR_TARGET_PERCENT,
      source: "default",
      sampleSize: 0,
    };
  }
}

/** Índice de Jaccard entre 2 conjuntos: interseção / união (0 a 1). */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1; // ambos sem opcionais = idênticos
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}
