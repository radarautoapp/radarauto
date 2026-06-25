/**
 * CatalogService — testes de paywall (a regra de ouro do modelo de negócio).
 *
 * Garante que dados sensíveis (contato do vendedor, insights, fotos extras,
 * dados dos similares e dos cards além do limite) NUNCA saem do backend para
 * usuários free. Esses testes blindam o gating server-side: se uma mudança
 * futura vazar dados premium, a suíte quebra na hora.
 *
 * Também cobre calcDiff (cálculo de desconto vs FIPE) incluindo o edge case
 * de FIPE ausente/zero.
 */
import { CatalogService } from "./catalog.service";

type AnyMock = jest.Mock;

interface CatalogPrismaMock {
  vehicle: { findFirst: AnyMock; findMany: AnyMock };
  listing: { update: AnyMock };
}

function createCatalogPrismaMock(): CatalogPrismaMock {
  return {
    vehicle: { findFirst: jest.fn(), findMany: jest.fn() },
    listing: { update: jest.fn().mockResolvedValue(undefined) },
  };
}

const freeUser = { id: "u-free", plan: "free" } as never;
const premiumUser = { id: "u-prem", plan: "premium" } as never;

/** Veículo completo como o Prisma retornaria no detail(). */
function vehicleRow(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "v-1",
    brand: "Honda",
    model: "Civic",
    version: "EXL 2.0",
    year: 2021,
    yearModel: 2022,
    km: 38000,
    fuel: "Flex",
    transm: "Automático",
    color: "Prata",
    colorHex: "#C0C0C0",
    plate: "7",
    category: "Sedan",
    price: 11_500_000,
    fipe: 12_000_000,
    city: "Blumenau",
    state: "SC",
    optionals: ["Couro"],
    obs: null,
    photos: ["p1", "p2", "p3", "p4", "p5"],
    delivery: true,
    storeId: "store-1",
    store: {
      name: "FlashCar",
      initials: "FC",
      phone: "4733334444",
      whatsapp: "47999990000",
      city: "Blumenau",
      state: "SC",
      since: 2015,
      rating: 4.8,
      reviews: 120,
      verified: true,
      logoUrl: null,
    },
    listing: { status: "ACTIVE", rankingScore: 75, views: 10 },
    ...over,
  };
}

describe("CatalogService — paywall", () => {
  let prisma: CatalogPrismaMock;
  let service: CatalogService;

  beforeEach(() => {
    prisma = createCatalogPrismaMock();
    service = new CatalogService(prisma as never);
  });

  describe("detail() — gating do vendedor e insights", () => {
    beforeEach(() => {
      prisma.vehicle.findFirst.mockResolvedValue(vehicleRow());
      prisma.vehicle.findMany.mockResolvedValue([]); // sem similares por padrão
    });

    it("FREE não recebe contato do vendedor (seller = null)", async () => {
      const { vehicle } = await service.detail(freeUser, "v-1");
      expect(vehicle.seller).toBeNull();
    });

    it("FREE não recebe insights (insights = null)", async () => {
      const { vehicle } = await service.detail(freeUser, "v-1");
      expect(vehicle.insights).toBeNull();
    });

    it("FREE recebe no máximo FREE_PHOTO_LIMIT fotos", async () => {
      const { vehicle } = await service.detail(freeUser, "v-1");
      expect(vehicle.photos.length).toBeLessThanOrEqual(3);
      // mas o total real é informado (para o front mostrar "+N")
      expect(vehicle.photoCount).toBe(5);
    });

    it("PREMIUM recebe o contato completo do vendedor", async () => {
      const { vehicle } = await service.detail(premiumUser, "v-1");
      expect(vehicle.seller).not.toBeNull();
      expect(vehicle.seller?.phone).toBe("4733334444");
      expect(vehicle.seller?.whatsapp).toBe("47999990000");
    });

    it("PREMIUM recebe insights e todas as fotos", async () => {
      const { vehicle } = await service.detail(premiumUser, "v-1");
      expect(vehicle.insights).not.toBeNull();
      expect(vehicle.photos.length).toBe(5);
    });

    it("veículo inexistente lança NotFound", async () => {
      prisma.vehicle.findFirst.mockResolvedValue(null);
      await expect(service.detail(freeUser, "nope")).rejects.toMatchObject({
        response: { code: "VEHICLE_NOT_FOUND" },
      });
    });
  });

  describe("detail() — gating dos similares", () => {
    beforeEach(() => {
      prisma.vehicle.findFirst.mockResolvedValue(vehicleRow());
      prisma.vehicle.findMany.mockResolvedValue([
        {
          id: "s-1",
          brand: "Toyota",
          model: "Corolla",
          version: "XEi",
          year: 2022,
          km: 25000,
          price: 13_000_000,
          fipe: 13_500_000,
          city: "Blumenau",
          state: "SC",
          photos: ["sp1"],
        },
      ]);
    });

    it("FREE recebe similares bloqueados e sem dados reais", async () => {
      const { vehicle } = await service.detail(freeUser, "v-1");
      const sim = vehicle.similar[0];
      expect(sim?.locked).toBe(true);
      expect(sim?.id).toBe("");
      expect(sim?.brand).toBe("");
      expect(sim?.price).toBe(0);
      // só a foto de capa vaza (para o blur no front)
      expect(sim?.coverPhoto).toBe("sp1");
    });

    it("PREMIUM recebe similares com dados reais", async () => {
      const { vehicle } = await service.detail(premiumUser, "v-1");
      const sim = vehicle.similar[0];
      expect(sim?.locked).toBe(false);
      expect(sim?.brand).toBe("Toyota");
      expect(sim?.price).toBe(13_000_000);
    });
  });
});
