/**
 * promo tests — brinde de Premium no cadastro (trial).
 *
 * Cobre o estado ATUAL (promoção ligada): novos cadastros nascem Premium em
 * trial trimestral, com expiração em PROMO_TRIAL_MONTHS meses. Se a promoção
 * for desligada no futuro, estes testes devem ser revistos junto.
 */
import { newUserSubscription, PROMO_TRIAL_ENABLED, PROMO_TRIAL_MONTHS } from "./promo";

describe("promo — newUserSubscription (promoção ligada)", () => {
  // Guard: estes testes assumem a promo ligada. Se desligarem, revisar.
  it("a promoção está ligada e dura 3 meses (estado atual)", () => {
    expect(PROMO_TRIAL_ENABLED).toBe(true);
    expect(PROMO_TRIAL_MONTHS).toBe(3);
  });

  it("novo cadastro nasce Premium", () => {
    const sub = newUserSubscription(new Date("2026-06-25T12:00:00.000Z"));
    expect(sub.plan).toBe("premium");
  });

  it("status é trialing e ciclo é quarterly", () => {
    const sub = newUserSubscription(new Date("2026-06-25T12:00:00.000Z"));
    expect(sub.subscriptionStatus).toBe("trialing");
    expect(sub.subscriptionCycle).toBe("quarterly");
  });

  it("expira exatamente PROMO_TRIAL_MONTHS meses depois", () => {
    const now = new Date("2026-06-25T12:00:00.000Z");
    const sub = newUserSubscription(now);
    expect(sub.subscriptionExpiresAt).not.toBeNull();
    const exp = sub.subscriptionExpiresAt as Date;
    // +3 meses de 25/jun → 25/set
    expect(exp.getFullYear()).toBe(2026);
    expect(exp.getMonth()).toBe(8); // setembro (0-indexed)
    expect(exp.getDate()).toBe(25);
  });

  it("lida com virada de ano (out → jan do ano seguinte)", () => {
    const now = new Date("2026-11-15T12:00:00.000Z");
    const sub = newUserSubscription(now);
    const exp = sub.subscriptionExpiresAt as Date;
    expect(exp.getFullYear()).toBe(2027);
    expect(exp.getMonth()).toBe(1); // fevereiro (nov + 3)
  });
});
