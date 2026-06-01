/**
 * feed-score tests
 *
 * Cobre a ordenação democrática do catálogo: recência dominante (65%) modulada
 * pelo Radar Score (35%). Valida o componente de recência, a composição e os
 * comportamentos-chave (novo+decente > velho+ótimo; novo+ótimo > novo+fraco).
 */
import { computeFeedScore, FEED_RECENCY_WINDOW_DAYS, recencyComponent } from "./feed-score";

const NOW = new Date("2026-06-01T12:00:00.000Z");
const daysAgo = (d: number): Date => new Date(NOW.getTime() - d * 24 * 60 * 60 * 1000);

describe("feed-score", () => {
  describe("recencyComponent", () => {
    it("é 100 para algo publicado agora", () => {
      expect(recencyComponent(NOW, NOW, NOW)).toBeCloseTo(100, 5);
    });

    it("decai pela metade na metade da janela", () => {
      const half = daysAgo(FEED_RECENCY_WINDOW_DAYS / 2);
      expect(recencyComponent(half, half, NOW)).toBeCloseTo(50, 1);
    });

    it("é 0 ao fim da janela e além", () => {
      expect(recencyComponent(daysAgo(FEED_RECENCY_WINDOW_DAYS), daysAgo(30), NOW)).toBe(0);
      expect(recencyComponent(daysAgo(90), daysAgo(90), NOW)).toBe(0);
    });

    it("usa publishedAt quando existe; cai para createdAt quando null", () => {
      const created = daysAgo(20);
      const published = daysAgo(2);
      // com publishedAt recente → alto
      expect(recencyComponent(published, created, NOW)).toBeGreaterThan(80);
      // sem publishedAt → usa createdAt (antigo) → baixo
      expect(recencyComponent(null, created, NOW)).toBeLessThan(40);
    });
  });

  describe("computeFeedScore", () => {
    it("fica entre 0 e 100", () => {
      const s = computeFeedScore({ rankingScore: 50, publishedAt: NOW, createdAt: NOW, now: NOW });
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    });

    it("recência domina: novo+ranking baixo supera velho+ranking alto", () => {
      const novoFraco = computeFeedScore({
        rankingScore: 30,
        publishedAt: NOW,
        createdAt: NOW,
        now: NOW,
      });
      const velhoOtimo = computeFeedScore({
        rankingScore: 95,
        publishedAt: daysAgo(25),
        createdAt: daysAgo(25),
        now: NOW,
      });
      expect(novoFraco).toBeGreaterThan(velhoOtimo);
    });

    it("entre anúncios da mesma idade, o Radar Score desempata", () => {
      const bom = computeFeedScore({
        rankingScore: 80,
        publishedAt: NOW,
        createdAt: NOW,
        now: NOW,
      });
      const fraco = computeFeedScore({
        rankingScore: 20,
        publishedAt: NOW,
        createdAt: NOW,
        now: NOW,
      });
      expect(bom).toBeGreaterThan(fraco);
    });

    it("novo+ótimo supera novo+fraco (ranking ainda importa)", () => {
      const novoOtimo = computeFeedScore({
        rankingScore: 90,
        publishedAt: NOW,
        createdAt: NOW,
        now: NOW,
      });
      const novoFraco = computeFeedScore({
        rankingScore: 10,
        publishedAt: NOW,
        createdAt: NOW,
        now: NOW,
      });
      expect(novoOtimo).toBeGreaterThan(novoFraco);
    });

    it("dois anúncios novos e idênticos têm o mesmo score", () => {
      const a = computeFeedScore({ rankingScore: 60, publishedAt: NOW, createdAt: NOW, now: NOW });
      const b = computeFeedScore({ rankingScore: 60, publishedAt: NOW, createdAt: NOW, now: NOW });
      expect(a).toBe(b);
    });
  });
});
