import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { Plan, UserRole } from "@prisma/client";
import * as argon2 from "argon2";

import { PrismaService } from "../../prisma/prisma.service";
import { AuthService } from "./auth.service";

const buildUser = (
  overrides: Partial<{
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    storeId: string | null;
    active: boolean;
    deletedAt: Date | null;
  }> = {},
) => ({
  id: "user-1",
  email: "user@radar.app",
  passwordHash: "hashed",
  name: "User",
  role: UserRole.revendedor,
  plan: Plan.free,
  subscriptionStatus: null,
  subscriptionCycle: null,
  storeId: null,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

const buildSession = (
  overrides: Partial<{
    id: string;
    userId: string;
    revokedAt: Date | null;
    expiresAt: Date;
  }> = {},
) => ({
  id: "session-1",
  userId: "user-1",
  ipAddress: null,
  userAgent: null,
  deviceLabel: null,
  lastSeenAt: new Date(),
  expiresAt: new Date(Date.now() + 86_400_000),
  createdAt: new Date(),
  revokedAt: null,
  ...overrides,
});

describe("AuthService", () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock };
    session: {
      create: jest.Mock;
      findUnique: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
    store: { create: jest.Mock };
  };
  let jwt: { signAsync: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
      session: {
        create: jest.fn().mockResolvedValue(buildSession()),
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        update: jest.fn().mockResolvedValue(buildSession()),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(),
      store: { create: jest.fn() },
    };
    jwt = { signAsync: jest.fn().mockResolvedValue("token.abc") };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: { getOrThrow: () => "secret" } },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  describe("login", () => {
    it("rejeita com mensagem genérica quando user não existe", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: "x@y.com", password: "any" }, {})).rejects.toMatchObject({
        response: { code: "INVALID_CREDENTIALS" },
      });
    });

    it("rejeita com mesma mensagem quando senha errada", async () => {
      const user = buildUser({ passwordHash: await argon2.hash("real-password") });
      prisma.user.findUnique.mockResolvedValue(user);
      await expect(
        service.login({ email: user.email, password: "wrong" }, {}),
      ).rejects.toMatchObject({
        response: { code: "INVALID_CREDENTIALS" },
      });
    });

    it("rejeita user desativado com ACCOUNT_DISABLED", async () => {
      const user = buildUser({ active: false, passwordHash: await argon2.hash("123") });
      prisma.user.findUnique.mockResolvedValue(user);
      await expect(service.login({ email: user.email, password: "123" }, {})).rejects.toMatchObject(
        { response: { code: "ACCOUNT_DISABLED" } },
      );
    });

    it("cria nova session ao logar (multi-device)", async () => {
      const password = "valid-password-123";
      const user = buildUser({ passwordHash: await argon2.hash(password) });
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.login(
        { email: user.email, password, deviceLabel: "iPhone" },
        { ipAddress: "1.2.3.4", userAgent: "Mozilla", deviceLabel: "iPhone" },
      );

      expect(result.token).toBe("token.abc");
      expect(prisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: user.id,
            ipAddress: "1.2.3.4",
            userAgent: "Mozilla",
            deviceLabel: "iPhone",
          }),
        }),
      );
      expect(prisma.session.updateMany).not.toHaveBeenCalled();
    });

    it("não devolve passwordHash no resultado", async () => {
      const password = "abc12345";
      const user = buildUser({ passwordHash: await argon2.hash(password) });
      prisma.user.findUnique.mockResolvedValue(user);
      const result = await service.login({ email: user.email, password }, {});
      expect((result.user as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
    });
  });

  describe("validateSession", () => {
    it("rejeita session inexistente", async () => {
      prisma.session.findUnique.mockResolvedValue(null);
      await expect(service.validateSession("user-1", "session-1")).rejects.toMatchObject({
        response: { code: "SESSION_INVALID" },
      });
    });

    it("rejeita session revogada", async () => {
      prisma.session.findUnique.mockResolvedValue({
        ...buildSession({ revokedAt: new Date() }),
        user: buildUser(),
      });
      await expect(service.validateSession("user-1", "session-1")).rejects.toMatchObject({
        response: { code: "SESSION_INVALID" },
      });
    });

    it("rejeita session expirada", async () => {
      prisma.session.findUnique.mockResolvedValue({
        ...buildSession({ expiresAt: new Date(Date.now() - 1000) }),
        user: buildUser(),
      });
      await expect(service.validateSession("user-1", "session-1")).rejects.toMatchObject({
        response: { code: "SESSION_INVALID" },
      });
    });

    it("rejeita user desativado", async () => {
      prisma.session.findUnique.mockResolvedValue({
        ...buildSession(),
        user: buildUser({ active: false }),
      });
      await expect(service.validateSession("user-1", "session-1")).rejects.toMatchObject({
        response: { code: "SESSION_INVALID" },
      });
    });

    it("aceita session válida e atualiza lastSeenAt", async () => {
      prisma.session.findUnique.mockResolvedValue({ ...buildSession(), user: buildUser() });
      const u = await service.validateSession("user-1", "session-1");
      expect(u.id).toBe("user-1");
      expect(prisma.session.update).toHaveBeenCalled();
    });
  });

  describe("registerFuncionario", () => {
    it("só lojista pode cadastrar funcionário", async () => {
      const actor = { id: "u1", role: UserRole.revendedor, storeId: null } as never;
      await expect(
        service.registerFuncionario({ name: "F", email: "f@x.com", password: "12345678" }, actor),
      ).rejects.toMatchObject({ response: { code: "FORBIDDEN" } });
    });

    it("lojista sem storeId é rejeitado", async () => {
      const actor = { id: "u1", role: UserRole.lojista, storeId: null } as never;
      await expect(
        service.registerFuncionario({ name: "F", email: "f@x.com", password: "12345678" }, actor),
      ).rejects.toMatchObject({ response: { code: "FORBIDDEN" } });
    });
  });

  describe("logoutAll", () => {
    it("revoga todas as sessions do user", async () => {
      prisma.session.updateMany.mockResolvedValue({ count: 3 });
      const r = await service.logoutAll("user-1");
      expect(r.revoked).toBe(3);
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
