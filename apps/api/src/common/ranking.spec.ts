/**
 * ranking tests (Radar Score)
 *
 * Cobertura da regra de negócio crítica que ordena os anúncios. Valida cada
 * bloco (oportunidade, engajamento, qualidade) e a composição final.
 */
import {
  computeRankingScore,
  engagementScore,
  opportunityScore,
  qualityScore,
  RANKING_WEIGHTS,
  type RankingInput,
} from "./ranking";

const NOW = new Date("2026-06-01T12:00:00.000Z");

function input(over: Partial<RankingInput> = {}): RankingInput {
  return {
    price: 100_00,
    fipe: 100_00,
    views: 0,
    favorites: 0,
    photoCount: 0,
    hasObs: false,
    year: 2020,
    km: 60000,
    publishedAt: null,
    now: NOW,
    ...over,
  };
}

describe("ranking", () => {
  describe("opportunityScore", () => {
    it("é 0 quando o preço é igual ou maior que a FIPE", () => {
      expect(opportunityScore(100_00, 100_00)).toBe(0);
      expect(opportunityScore(120_00, 100_00)).toBe(0);
    });

    it("dá o máximo com 30%+ abaixo da FIPE", () => {
      expect(opportunityScore(70_00, 100_00)).toBeCloseTo(RANKING_WEIGHTS.opportunity, 5);
      expect(opportunityScore(50_00, 100_00)).toBe(RANKING_WEIGHTS.opportunity);
    });

    it("escala proporcionalmente em descontos intermediários (15% → metade)", () => {
      expect(opportunityScore(85_00, 100_00)).toBeCloseTo(RANKING_WEIGHTS.opportunity / 2, 1);
    });

    it("retorna 0 com valores inválidos (zero/negativo)", () => {
      expect(opportunityScore(0, 100_00)).toBe(0);
      expect(opportunityScore(100_00, 0)).toBe(0);
    });
  });

  describe("engagementScore", () => {
    it("é 0 sem views nem favoritos", () => {
      expect(engagementScore(0, 0)).toBe(0);
    });

    it("favorito vale mais que view", () => {
      expect(engagementScore(0, 1)).toBeGreaterThan(engagementScore(1, 0));
    });

    it("cresce com engajamento mas não passa do teto", () => {
      const big = engagementScore(10000, 5000);
      expect(big).toBeLessThanOrEqual(RANKING_WEIGHTS.engagement);
      expect(big).toBeGreaterThan(engagementScore(10, 1));
    });

    it("trata negativos como zero", () => {
      expect(engagementScore(-5, -2)).toBe(0);
    });
  });

  describe("qualityScore", () => {
    it("é 0 para um anúncio sem fotos, sem obs, sem data e muito rodado", () => {
      // km/ano >= 25000 zera o bloco de km; sem fotos/obs/data zera o resto.
      const s = qualityScore(
        input({ photoCount: 0, hasObs: false, publishedAt: null, year: 2020, km: 200000 }),
      );
      expect(s).toBe(0);
    });

    it("dá o máximo de fotos com 6+", () => {
      const few = qualityScore(input({ photoCount: 1 }));
      const many = qualityScore(input({ photoCount: 8 }));
      expect(many).toBeGreaterThan(few);
    });

    it("observações somam pontos", () => {
      const withObs = qualityScore(input({ hasObs: true }));
      const without = qualityScore(input({ hasObs: false }));
      expect(withObs - without).toBeCloseTo(3, 5);
    });

    it("recência: publicado hoje pontua mais que publicado há 30 dias", () => {
      const today = qualityScore(input({ publishedAt: NOW }));
      const monthAgo = qualityScore(
        input({ publishedAt: new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000) }),
      );
      expect(today).toBeGreaterThan(monthAgo);
    });

    it("carro pouco rodado pontua mais que muito rodado", () => {
      const low = qualityScore(input({ year: 2022, km: 20000 }));
      const high = qualityScore(input({ year: 2022, km: 200000 }));
      expect(low).toBeGreaterThan(high);
    });
  });

  describe("computeRankingScore", () => {
    it("fica entre 0 e 100", () => {
      const s = computeRankingScore(input());
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    });

    it("anúncio excelente (barato, engajado, completo, novo) pontua alto", () => {
      const s = computeRankingScore(
        input({
          price: 65_00,
          fipe: 100_00,
          views: 500,
          favorites: 50,
          photoCount: 8,
          hasObs: true,
          year: 2023,
          km: 15000,
          publishedAt: NOW,
        }),
      );
      expect(s).toBeGreaterThan(75);
    });

    it("anúncio fraco (caro, sem engajamento, incompleto) pontua baixo", () => {
      const s = computeRankingScore(
        input({
          price: 110_00,
          fipe: 100_00,
          views: 0,
          favorites: 0,
          photoCount: 0,
          hasObs: false,
          year: 2008,
          km: 280000,
          publishedAt: null,
        }),
      );
      expect(s).toBeLessThan(15);
    });

    it("arredonda a 1 casa decimal", () => {
      const s = computeRankingScore(input({ price: 85_00, fipe: 100_00 }));
      expect(Number.isFinite(s)).toBe(true);
      expect(s).toBeCloseTo(Math.round(s * 10) / 10, 10);
    });
  });
});
