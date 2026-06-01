/**
 * ranking.ts — cálculo do Radar Score (0–100).
 *
 * Lógica de negócio pura e isolada (sem dependência de Prisma/IO), para ser
 * facilmente testável. O score é derivado e salvo em Listing.rankingScore;
 * recalculado quando o anúncio é criado, editado ou aprovado.
 *
 * Composição (soma ponderada, teto 100):
 *   - Oportunidade (45): quanto o preço está abaixo da FIPE.
 *   - Engajamento  (30): views + favoritos (favorito pesa mais), com saturação.
 *   - Qualidade    (25): fotos, observações, recência e km/ano do veículo.
 */

export interface RankingInput {
  price: number; // centavos
  fipe: number; // centavos
  views: number;
  favorites: number;
  photoCount: number;
  hasObs: boolean;
  year: number; // ano de fabricação
  km: number;
  publishedAt: Date | null;
  now?: Date; // injetável para testes
}

/** Pesos de cada bloco (somam 100). */
export const RANKING_WEIGHTS = {
  opportunity: 45,
  engagement: 30,
  quality: 25,
} as const;

/** Limita um número ao intervalo [min, max]. */
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Bloco Oportunidade (0–45). Linear no desconto vs FIPE:
 *   preço >= FIPE  → 0
 *   30%+ abaixo    → 45 (máximo)
 * Descontos intermediários escalam proporcionalmente.
 */
export function opportunityScore(price: number, fipe: number): number {
  if (fipe <= 0 || price <= 0) return 0;
  const discount = (fipe - price) / fipe; // 0.20 = 20% abaixo
  const MAX_DISCOUNT = 0.3; // 30% abaixo já dá o máximo
  const ratio = clamp(discount / MAX_DISCOUNT, 0, 1);
  return ratio * RANKING_WEIGHTS.opportunity;
}

/**
 * Bloco Engajamento (0–30). views + favoritos com saturação logarítmica
 * (evita que números altos dominem). Favorito vale ~5x uma view.
 */
export function engagementScore(views: number, favorites: number): number {
  const weighted = Math.max(0, views) + Math.max(0, favorites) * 5;
  // saturação: log faz crescer rápido no início e desacelerar.
  // ~600 de "weighted" satura perto do máximo.
  const SATURATION = 600;
  const ratio = clamp(Math.log10(1 + weighted) / Math.log10(1 + SATURATION), 0, 1);
  return ratio * RANKING_WEIGHTS.engagement;
}

/**
 * Bloco Qualidade (0–25): fotos (até 10), observações (3), recência (até 7)
 * e km/idade do veículo (até 5).
 */
export function qualityScore(input: RankingInput): number {
  const now = input.now ?? new Date();

  // Fotos: 0 → 0; 6+ → 10 (linear).
  const photos = clamp(input.photoCount / 6, 0, 1) * 10;

  // Observações preenchidas: +3.
  const obs = input.hasObs ? 3 : 0;

  // Recência: publicado hoje → 7; decai linear até 0 em 30 dias.
  let recency = 0;
  if (input.publishedAt) {
    const days = (now.getTime() - input.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
    recency = clamp(1 - days / 30, 0, 1) * 7;
  }

  // Km por ano de idade: quanto menos rodado, melhor. <=10k/ano → 5; >=25k/ano → 0.
  const age = Math.max(1, now.getFullYear() - input.year);
  const kmPerYear = input.km / age;
  const kmScore = clamp(1 - (kmPerYear - 10000) / 15000, 0, 1) * 5;

  return photos + obs + recency + kmScore;
}

/** Radar Score final (0–100), arredondado a 1 casa. */
export function computeRankingScore(input: RankingInput): number {
  const total =
    opportunityScore(input.price, input.fipe) +
    engagementScore(input.views, input.favorites) +
    qualityScore(input);
  return Math.round(clamp(total, 0, 100) * 10) / 10;
}
