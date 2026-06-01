/**
 * feed-score.ts — ordenação do catálogo (relevância democrática).
 *
 * Lógica pura e isolada (sem IO), testável. Define a ORDEM em que os anúncios
 * aparecem no catálogo. Diferente do Radar Score (ranking.ts), que mede a
 * QUALIDADE do anúncio e é exibido ao lojista, o feed score equilibra:
 *
 *   - Recência (65%): anúncios mais novos sobem. Todo anúncio tem seu período
 *     de visibilidade quando entra, evitando que só os "campeões" históricos
 *     dominem o topo eternamente (catálogo mais democrático).
 *   - Radar Score (35%): entre anúncios de idade parecida, os melhores
 *     (preço abaixo da FIPE, bem fotografados, engajados) levam vantagem.
 *
 * Resultado: "novo + decente" supera "velho + ótimo", mas "novo + fraco" NÃO
 * supera "novo + ótimo". O catálogo respira — novos entram no topo e descem
 * gradualmente conforme envelhecem.
 */

export const FEED_WEIGHTS = {
  recency: 65,
  ranking: 35,
} as const;

/** Em quantos dias um anúncio perde toda a "vantagem de novidade". */
export const FEED_RECENCY_WINDOW_DAYS = 30;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Componente de recência (0–100). Recém-publicado = 100; decai linear até 0 ao
 * fim da janela (30 dias). Usa publishedAt quando existe (quando o anúncio
 * passou a aparecer no catálogo); senão cai para createdAt.
 */
export function recencyComponent(
  reference: Date | null,
  createdAt: Date,
  now: Date = new Date(),
): number {
  const base = reference ?? createdAt;
  const days = (now.getTime() - base.getTime()) / (1000 * 60 * 60 * 24);
  return clamp(1 - days / FEED_RECENCY_WINDOW_DAYS, 0, 1) * 100;
}

/**
 * Feed score final (0–100): mistura recência (dominante) e Radar Score.
 * rankingScore já vem na escala 0–100.
 */
export function computeFeedScore(params: {
  rankingScore: number;
  publishedAt: Date | null;
  createdAt: Date;
  now?: Date;
}): number {
  const now = params.now ?? new Date();
  const recency = recencyComponent(params.publishedAt, params.createdAt, now);
  const ranking = clamp(params.rankingScore, 0, 100);
  const score =
    (FEED_WEIGHTS.recency * recency + FEED_WEIGHTS.ranking * ranking) /
    (FEED_WEIGHTS.recency + FEED_WEIGHTS.ranking);
  return Math.round(score * 10) / 10;
}
