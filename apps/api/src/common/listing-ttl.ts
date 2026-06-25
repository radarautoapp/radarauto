/**
 * listing-ttl.ts — janela de validade de um anúncio ativo.
 *
 * Um anúncio fica ACTIVE por LISTING_TTL_HOURS após ser publicado/reativado.
 * Passado esse prazo, o job de expiração o move para INACTIVE (pausado). O
 * lojista pode reativá-lo manualmente para ganhar uma nova janela.
 */

/** Horas que um anúncio permanece ativo antes de expirar. */
export const LISTING_TTL_HOURS = 24;

/** Retorna a data de expiração a partir de um instante (default: agora). */
export function listingExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + LISTING_TTL_HOURS * 60 * 60 * 1000);
}
