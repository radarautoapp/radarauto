/**
 * LeadsService — testes do gating Premium (Engine de Leads é exclusivo Premium).
 *
 * O acesso vale para toda a loja: o gating olha o plano do LOJISTA DONO, não o
 * do usuário que chama (um funcionário é sempre free, mas herda o acesso da
 * loja). Estes testes travam esse comportamento contra regressão.
 */
import { LeadsService } from "./leads.service";

type AnyMock = jest.Mock;

interface LeadsPrismaMock {
  vehicle: { findMany: AnyMock };
  user: { findFirst: AnyMock; findMany: AnyMock };
}

function createLeadsPrismaMock(): LeadsPrismaMock {
  return {
    vehicle: { findMany: jest.fn().mockResolvedValue([]) },
    user: { findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
  };
}

const lojistaFreeStore = { id: "u-1", storeId: "store-1", role: "lojista", plan: "free" } as never;
const lojistaPremiumStore = {
  id: "u-2",
  storeId: "store-2",
  role: "lojista",
  plan: "premium",
} as never;
const funcionarioPremiumStore = {
  id: "u-3",
  storeId: "store-2",
  role: "funcionario",
  plan: "free", // funcionário é sempre free, mas a loja é premium
} as never;
const semLoja = { id: "u-4", storeId: null, role: "revendedor", plan: "premium" } as never;

describe("LeadsService — gating Premium", () => {
  let prisma: LeadsPrismaMock;
  let service: LeadsService;

  beforeEach(() => {
    prisma = createLeadsPrismaMock();
    service = new LeadsService(prisma as never);
  });

  it("sem loja → NO_STORE", async () => {
    await expect(service.listForStore(semLoja)).rejects.toMatchObject({
      response: { code: "NO_STORE" },
    });
  });

  it("dono da loja é free → PREMIUM_REQUIRED", async () => {
    // owner lookup retorna lojista free
    prisma.user.findFirst.mockResolvedValue({ plan: "free" });
    await expect(service.listForStore(lojistaFreeStore)).rejects.toMatchObject({
      response: { code: "PREMIUM_REQUIRED" },
    });
  });

  it("lojista premium → acessa (sem lançar)", async () => {
    prisma.user.findFirst.mockResolvedValue({ plan: "premium" });
    const res = await service.listForStore(lojistaPremiumStore);
    expect(res).toBeDefined();
  });

  it("funcionário de loja premium → acessa (herda o plano da loja)", async () => {
    // o owner lookup encontra o lojista premium da mesma loja
    prisma.user.findFirst.mockResolvedValue({ plan: "premium" });
    const res = await service.listForStore(funcionarioPremiumStore);
    expect(res).toBeDefined();
    // confirma que o gating consultou o DONO (lojista) da loja, não o próprio user
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ storeId: "store-2", role: "lojista" }),
      }),
    );
  });
});
