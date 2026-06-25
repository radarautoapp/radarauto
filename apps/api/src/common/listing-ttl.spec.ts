/**
 * listing-ttl tests — janela de validade do anúncio (24h).
 */
import { LISTING_TTL_HOURS, listingExpiresAt } from "./listing-ttl";

describe("listing-ttl", () => {
  it("a janela padrão é de 24 horas", () => {
    expect(LISTING_TTL_HOURS).toBe(24);
  });

  it("listingExpiresAt soma exatamente LISTING_TTL_HOURS ao instante dado", () => {
    const now = new Date("2026-06-25T12:00:00.000Z");
    const exp = listingExpiresAt(now);
    const diffHours = (exp.getTime() - now.getTime()) / (1000 * 60 * 60);
    expect(diffHours).toBe(LISTING_TTL_HOURS);
  });

  it("não muta a data de entrada", () => {
    const now = new Date("2026-06-25T12:00:00.000Z");
    const snapshot = now.getTime();
    listingExpiresAt(now);
    expect(now.getTime()).toBe(snapshot);
  });

  it("expira no futuro em relação a agora (chamada sem argumento)", () => {
    const before = Date.now();
    const exp = listingExpiresAt();
    expect(exp.getTime()).toBeGreaterThan(before);
  });
});
