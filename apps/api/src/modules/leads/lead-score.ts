/**
 * lead-score.ts — engine de qualificação de leads (0–100 → COLD/WARM/HOT).
 *
 * Lógica de negócio pura e isolada (sem IO), para ser testável. O score é
 * derivado dos sinais de comportamento do interessado em um anúncio e salvo
 * em Lead.score; recalculado a cada evento (view, tempo, favorito, contato).
 *
 * Sinais e pesos (pontos, teto 100):
 *   - Cliques/visitas (até 15): recorrência de interesse, satura.
 *   - Tempo na tela (até 25): engajamento real (quem fica, considera de verdade).
 *   - Favoritou (+20): sinal forte de consideração.
 *   - Recência (até 15): visto recentemente = mais quente; decai com os dias.
 *   - Contato WhatsApp (+30): intenção de compra — o sinal mais forte.
 *   - Contato Telegram (+25): intenção de compra.
 *
 * Faixas: COLD 0–29 · WARM 30–64 · HOT 65–100.
 * Um contato (WhatsApp/Telegram) sozinho já leva a HOT/quase. Visita rápida e
 * única fica COLD. Várias visitas + tempo + favorito sobe a WARM sem contato.
 */

export type LeadScoreLabel = "COLD" | "WARM" | "HOT";

export interface LeadSignals {
  clicks: number;
  avgTimeSeconds: number;
  favorited: boolean;
  whatsappClicked: boolean;
  telegramClicked: boolean;
  lastSeen: Date;
  now?: Date;
}

export const LEAD_WEIGHTS = {
  clicks: 15,
  time: 25,
  favorited: 20,
  recency: 15,
  whatsapp: 30,
  telegram: 25,
} as const;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Cliques: satura em ~6 visitas (log) para não recompensar refresh infinito. */
export function clicksScore(clicks: number): number {
  const c = Math.max(0, clicks);
  const ratio = clamp(Math.log10(1 + c) / Math.log10(1 + 6), 0, 1);
  return ratio * LEAD_WEIGHTS.clicks;
}

/** Tempo acumulado: ~5 min (300s) satura o máximo. */
export function timeScore(avgTimeSeconds: number): number {
  const t = Math.max(0, avgTimeSeconds);
  const ratio = clamp(t / 300, 0, 1);
  return ratio * LEAD_WEIGHTS.time;
}

/** Recência: visto hoje = máximo; decai linear até 0 em 14 dias. */
export function recencyScore(lastSeen: Date, now: Date): number {
  const days = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);
  return clamp(1 - days / 14, 0, 1) * LEAD_WEIGHTS.recency;
}

/** Pontuação total (0–100). */
export function computeLeadPoints(signals: LeadSignals): number {
  const now = signals.now ?? new Date();
  let pts = 0;
  pts += clicksScore(signals.clicks);
  pts += timeScore(signals.avgTimeSeconds);
  pts += signals.favorited ? LEAD_WEIGHTS.favorited : 0;
  pts += recencyScore(signals.lastSeen, now);
  pts += signals.whatsappClicked ? LEAD_WEIGHTS.whatsapp : 0;
  pts += signals.telegramClicked ? LEAD_WEIGHTS.telegram : 0;
  return Math.round(clamp(pts, 0, 100) * 10) / 10;
}

/** Converte pontos em faixa COLD/WARM/HOT. */
export function pointsToLabel(points: number): LeadScoreLabel {
  if (points >= 65) return "HOT";
  if (points >= 30) return "WARM";
  return "COLD";
}

/**
 * Sinais → label. Regra de piso: tentar contato (WhatsApp/Telegram) é intenção
 * explícita de compra e garante HOT, independente dos demais sinais.
 */
export function computeLeadScore(signals: LeadSignals): LeadScoreLabel {
  if (signals.whatsappClicked || signals.telegramClicked) return "HOT";
  return pointsToLabel(computeLeadPoints(signals));
}
