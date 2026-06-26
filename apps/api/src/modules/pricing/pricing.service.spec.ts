/**
 * PricingService — testes do engine de Preço Recomendado.
 *
 * Cobre as duas estratégias (fallback FIPE-10% e média ponderada por
 * similaridade de opcionais) e os edge cases (FIPE zero, poucos comparáveis,
 * arredondamento para múltiplo de R$ 100).
 */
import { PricingService } from "./pricing.service";

interface PricingPrismaMock {
  vehicle: { findMany: jest.Mock };
}

function createPricingPrismaMock(): PricingPrismaMock {
  return { vehicle: { findMany: jest.fn().mockResolvedValue([]) } };
}

const baseParams = {
  fipeCents: 10_000_000, // R$ 100.000
  brand: "Honda",
  model: "Civic",
  category: "Sedan",
  year: 2021,
  optionals: ["Couro", "Teto solar"],
};

describe("PricingService", () => {
  let prisma: PricingPrismaMock;
  let service: PricingService;

  beforeEach(() => {
    prisma = createPricingPrismaMock();
    service = new PricingService(prisma as never);
  });

  describe("fallback (FIPE -10%)", () => {
    it("FIPE zero → preço 0, source default", async () => {
      const res = await service.recommend({ ...baseParams, fipeCents: 0 });
      expect(res.priceCents).toBe(0);
      expect(res.source).toBe("default");
      expect(res.sampleSize).toBe(0);
    });

    it("menos de 3 comparáveis → fallback FIPE -10%", async () => {
      prisma.vehicle.findMany.mockResolvedValue([
        { price: 9_500_000, optionals: [] },
        { price: 9_800_000, optionals: [] },
      ]); // só 2 comparáveis
      const res = await service.recommend(baseParams);
      expect(res.source).toBe("default");
      expect(res.diffPercent).toBe(-10);
      // 100k - 10% = 90k = 9_000_000 centavos
      expect(res.priceCents).toBe(9_000_000);
    });

    it("sem comparáveis → fallback", async () => {
      prisma.vehicle.findMany.mockResolvedValue([]);
      const res = await service.recommend(baseParams);
      expect(res.source).toBe("default");
      expect(res.priceCents).toBe(9_000_000);
    });
  });

  describe("média ponderada (>= 3 comparáveis)", () => {
    it("usa os comparáveis e marca source=comparables", async () => {
      prisma.vehicle.findMany.mockResolvedValue([
        { price: 10_000_000, optionals: ["Couro", "Teto solar"] },
        { price: 10_200_000, optionals: ["Couro", "Teto solar"] },
        { price: 9_800_000, optionals: ["Couro", "Teto solar"] },
      ]);
      const res = await service.recommend(baseParams);
      expect(res.source).toBe("comparables");
      expect(res.sampleSize).toBe(3);
      // todos idênticos em opcionais → média simples ~10.000.000
      expect(res.priceCents).toBe(10_000_000);
    });

    it("arredonda para múltiplo de R$ 100", async () => {
      prisma.vehicle.findMany.mockResolvedValue([
        { price: 10_012_345, optionals: ["Couro"] },
        { price: 10_012_345, optionals: ["Couro"] },
        { price: 10_012_345, optionals: ["Couro"] },
      ]);
      const res = await service.recommend(baseParams);
      // priceCents deve ser múltiplo de 10000 (R$100)
      expect(res.priceCents % 10000).toBe(0);
    });

    it("carros com opcionais mais parecidos pesam mais na média", async () => {
      // 3 comparáveis: 2 caros idênticos em opcionais ao alvo, 1 barato sem nada
      prisma.vehicle.findMany.mockResolvedValue([
        { price: 12_000_000, optionals: ["Couro", "Teto solar"] }, // peso alto (sim=1 → 1.5)
        { price: 12_000_000, optionals: ["Couro", "Teto solar"] }, // peso alto
        { price: 6_000_000, optionals: [] }, // peso baixo (sim=0 → 0.5)
      ]);
      const res = await service.recommend(baseParams);
      // média simples seria 10M; ponderada puxa pra cima (os caros pesam mais)
      // (12*1.5 + 12*1.5 + 6*0.5) / (1.5+1.5+0.5) = 39/3.5 = 11.14M → arredonda
      expect(res.priceCents).toBeGreaterThan(10_000_000);
    });

    it("diffPercent reflete a diferença vs FIPE", async () => {
      prisma.vehicle.findMany.mockResolvedValue([
        { price: 9_000_000, optionals: ["Couro"] },
        { price: 9_000_000, optionals: ["Couro"] },
        { price: 9_000_000, optionals: ["Couro"] },
      ]);
      const res = await service.recommend(baseParams);
      // 90k vs FIPE 100k = -10%
      expect(res.diffPercent).toBe(-10);
    });
  });
});
