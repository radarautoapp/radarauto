/**
 * AuthService unit tests
 *
 * Cobertura crítica (Regra 27):
 *   - registerRevendedor: feliz, email duplicado, cpf duplicado, cpf inválido,
 *     token de email errado, token de telefone errado
 *   - registerLojista: feliz, cnpj duplicado, cnpj inativo
 *   - registerFuncionario: ok, não-lojista bloqueado
 *   - login: credenciais válidas, senha errada, email inexistente,
 *     conta desativada (sem vazar existência de email)
 *   - logout / logoutAll
 *   - validateSession: válida, revogada, expirada, user inativo
 *   - isEmailAvailable, isCpfAvailable
 *
 * Mocks: PrismaService, JwtService, CnpjService, VerificationService, argon2
 */
import { ConflictException, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";

import { AuthService } from "./auth.service";
import { createPrismaMock, PrismaMock } from "../../test-helpers/prisma.mock";

jest.mock("argon2", () => ({
  argon2id: 2,
  hash: jest.fn(async () => "hashed-password"),
  verify: jest.fn(async () => true),
}));

const VALID_CPF = "11144477735";
const VALID_CNPJ = "11222333000181";
const FAKE_CTX = { ipAddress: "127.0.0.1", userAgent: "jest", deviceLabel: "test" };

function makeUser(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "user-1",
    email: "user@radar.com",
    passwordHash: "hashed-password",
    name: "Matheus Santana",
    phone: "47999990000",
    cpf: VALID_CPF,
    role: "revendedor",
    plan: "free",
    subscriptionStatus: null,
    subscriptionCycle: null,
    storeId: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe("AuthService", () => {
  let service: AuthService;
  let prisma: PrismaMock;
  let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let cnpjService: { lookup: jest.Mock };
  let verificationService: { consumeToken: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    jwt = {
      signAsync: jest.fn(async () => "fake-jwt-token"),
      verifyAsync: jest.fn(async () => ({})),
    };
    cnpjService = { lookup: jest.fn() };
    verificationService = { consumeToken: jest.fn() };
    service = new AuthService(
      prisma as never,
      jwt as never as JwtService,
      cnpjService as never,
      verificationService as never,
    );
  });

  /* --------------------------- registerRevendedor --------------------------- */

  describe("registerRevendedor", () => {
    const dto = {
      name: "Matheus Santana",
      email: "novo@radar.com",
      phone: "(47) 99999-0000",
      cpf: "111.444.777-35",
      password: "senha12345",
      emailVerificationToken: "x".repeat(30),
      phoneVerificationToken: "y".repeat(30),
    };

    it("cria o usuário e retorna sessão + token", async () => {
      verificationService.consumeToken.mockResolvedValue(undefined);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(makeUser({ email: dto.email }));
      prisma.session.create.mockResolvedValue({ id: "session-1", expiresAt: new Date() });

      const result = await service.registerRevendedor(dto, FAKE_CTX);

      expect(verificationService.consumeToken).toHaveBeenCalledWith(
        dto.emailVerificationToken,
        "email",
        dto.email,
      );
      expect(verificationService.consumeToken).toHaveBeenCalledWith(
        dto.phoneVerificationToken,
        "phone",
        dto.phone,
      );
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: dto.email.toLowerCase(),
          cpf: VALID_CPF,
          role: "revendedor",
        }),
      });
      expect(result.user.email).toBe(dto.email);
      expect(result.token).toBe("fake-jwt-token");
      expect(result.sessionId).toBe("session-1");
    });

    it("rejeita se email já existe (após consumir tokens)", async () => {
      verificationService.consumeToken.mockResolvedValue(undefined);
      prisma.user.findUnique.mockResolvedValueOnce({ id: "existing" });

      await expect(service.registerRevendedor(dto, FAKE_CTX)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("rejeita se cpf é inválido", async () => {
      verificationService.consumeToken.mockResolvedValue(undefined);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.registerRevendedor({ ...dto, cpf: "111.111.111-11" }, FAKE_CTX),
      ).rejects.toMatchObject({
        response: { code: "INVALID_CPF" },
      });
    });

    it("rejeita se cpf já existe", async () => {
      verificationService.consumeToken.mockResolvedValue(undefined);
      prisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "existing-cpf-user" });

      await expect(service.registerRevendedor(dto, FAKE_CTX)).rejects.toMatchObject({
        response: { code: "CPF_ALREADY_EXISTS" },
      });
    });

    it("propaga erro do consumeToken (token inválido)", async () => {
      verificationService.consumeToken.mockRejectedValueOnce(
        new ConflictException({ code: "INVALID_VERIFICATION_TOKEN", message: "x" }),
      );

      await expect(service.registerRevendedor(dto, FAKE_CTX)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  /* --------------------------- registerLojista --------------------------- */

  describe("registerLojista", () => {
    const dto = {
      name: "Matheus Santana",
      email: "lojista@radar.com",
      phone: "(47) 99999-0000",
      cpf: "111.444.777-35",
      password: "senha12345",
      cnpj: "11.222.333/0001-81",
      emailVerificationToken: "x".repeat(30),
      phoneVerificationToken: "y".repeat(30),
    };

    it("cria loja + usuário em transação", async () => {
      verificationService.consumeToken.mockResolvedValue(undefined);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.store.findUnique.mockResolvedValue(null);
      cnpjService.lookup.mockResolvedValue({
        legalName: "FLASH CAR STORE LTDA",
        tradeName: "Flash Car",
        cnpj: VALID_CNPJ,
        city: "Blumenau",
        state: "SC",
        phone: "(47) 3234-1270",
        email: null,
        openedAt: "23/05/2019",
        status: "ATIVA",
      });
      prisma.store.create.mockResolvedValue({ id: "store-1" });
      prisma.user.create.mockResolvedValue(makeUser({ role: "lojista", storeId: "store-1" }));
      prisma.session.create.mockResolvedValue({ id: "session-1", expiresAt: new Date() });

      const result = await service.registerLojista(dto, FAKE_CTX);

      expect(prisma.store.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cnpj: VALID_CNPJ,
            city: "Blumenau",
            state: "SC",
            since: 2019,
          }),
        }),
      );
      expect(result.user.role).toBe("lojista");
    });

    it("rejeita se cnpj inválido", async () => {
      verificationService.consumeToken.mockResolvedValue(undefined);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.registerLojista({ ...dto, cnpj: "11.111.111/1111-11" }, FAKE_CTX),
      ).rejects.toMatchObject({ response: { code: "INVALID_CNPJ_FORMAT" } });
    });

    it("rejeita se cnpj já existe", async () => {
      verificationService.consumeToken.mockResolvedValue(undefined);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.store.findUnique.mockResolvedValueOnce({ id: "existing-store" });

      await expect(service.registerLojista(dto, FAKE_CTX)).rejects.toMatchObject({
        response: { code: "CNPJ_ALREADY_EXISTS" },
      });
    });

    it("rejeita se cnpj inativo na Receita", async () => {
      verificationService.consumeToken.mockResolvedValue(undefined);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.store.findUnique.mockResolvedValue(null);
      cnpjService.lookup.mockResolvedValue({
        cnpj: VALID_CNPJ,
        legalName: "X",
        tradeName: null,
        city: "X",
        state: "X",
        phone: null,
        email: null,
        openedAt: null,
        status: "BAIXADA",
      });

      await expect(service.registerLojista(dto, FAKE_CTX)).rejects.toMatchObject({
        response: { code: "CNPJ_INACTIVE" },
      });
    });
  });

  /* --------------------------- registerFuncionario --------------------------- */

  describe("registerFuncionario", () => {
    const actor = makeUser({ role: "lojista", storeId: "store-1" });
    const dto = {
      name: "Maria",
      email: "maria@radar.com",
      password: "senha12345",
    };

    it("permite lojista criar funcionário", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(
        makeUser({ role: "funcionario", storeId: "store-1", email: dto.email }),
      );

      const result = await service.registerFuncionario(dto, actor as never);

      expect(result.role).toBe("funcionario");
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ role: "funcionario", storeId: "store-1" }),
      });
    });

    it("rejeita se ator não é lojista", async () => {
      const revendedor = makeUser({ role: "revendedor", storeId: null });
      await expect(service.registerFuncionario(dto, revendedor as never)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  /* --------------------------- login --------------------------- */

  describe("login", () => {
    const dto = { email: "user@radar.com", password: "senha12345" };

    it("autentica com credenciais corretas", async () => {
      const user = makeUser();
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.session.create.mockResolvedValue({ id: "session-1", expiresAt: new Date() });
      (argon2.verify as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.login(dto, FAKE_CTX);

      expect(result.token).toBe("fake-jwt-token");
      expect(result.user.email).toBe(user.email);
    });

    it("rejeita senha incorreta com mensagem genérica", async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      (argon2.verify as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(dto, FAKE_CTX)).rejects.toMatchObject({
        response: { code: "INVALID_CREDENTIALS" },
      });
    });

    it("rejeita email inexistente com MESMA mensagem (não vaza existência)", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto, FAKE_CTX)).rejects.toMatchObject({
        response: { code: "INVALID_CREDENTIALS" },
      });
    });

    it("rejeita conta desativada com mensagem específica", async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ active: false }));

      await expect(service.login(dto, FAKE_CTX)).rejects.toMatchObject({
        response: { code: "ACCOUNT_DISABLED" },
      });
    });

    it("rejeita usuário deletado como credenciais inválidas", async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ deletedAt: new Date() }));

      await expect(service.login(dto, FAKE_CTX)).rejects.toMatchObject({
        response: { code: "INVALID_CREDENTIALS" },
      });
    });
  });

  /* --------------------------- logout/logoutAll --------------------------- */

  describe("logout", () => {
    it("revoga a sessão específica", async () => {
      prisma.session.updateMany.mockResolvedValue({ count: 1 });
      await service.logout("session-1");
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { id: "session-1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe("logoutAll", () => {
    it("revoga todas as sessões ativas do user", async () => {
      prisma.session.updateMany.mockResolvedValue({ count: 3 });
      const result = await service.logoutAll("user-1");
      expect(result.revoked).toBe(3);
    });
  });

  /* --------------------------- validateSession --------------------------- */

  describe("validateSession", () => {
    function makeSession(
      overrides: Partial<Record<string, unknown>> = {},
    ): Record<string, unknown> {
      return {
        id: "session-1",
        userId: "user-1",
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86_400_000),
        user: makeUser(),
        ...overrides,
      };
    }

    it("retorna user sem passwordHash quando sessão válida", async () => {
      prisma.session.findUnique.mockResolvedValue(makeSession());
      prisma.session.update.mockResolvedValue({});

      const result = await service.validateSession("user-1", "session-1");

      expect(result.email).toBe("user@radar.com");
      expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
    });

    it("rejeita se session inexistente", async () => {
      prisma.session.findUnique.mockResolvedValue(null);
      await expect(service.validateSession("user-1", "session-x")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("rejeita se userId não bate", async () => {
      prisma.session.findUnique.mockResolvedValue(makeSession({ userId: "outro" }));
      await expect(service.validateSession("user-1", "session-1")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("rejeita se session revogada", async () => {
      prisma.session.findUnique.mockResolvedValue(makeSession({ revokedAt: new Date() }));
      await expect(service.validateSession("user-1", "session-1")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("rejeita se session expirada", async () => {
      prisma.session.findUnique.mockResolvedValue(
        makeSession({ expiresAt: new Date(Date.now() - 1000) }),
      );
      await expect(service.validateSession("user-1", "session-1")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("rejeita se user inativo", async () => {
      prisma.session.findUnique.mockResolvedValue(
        makeSession({ user: makeUser({ active: false }) }),
      );
      await expect(service.validateSession("user-1", "session-1")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  /* --------------------------- availability checks --------------------------- */

  describe("isEmailAvailable", () => {
    it("retorna true se não encontrar", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      expect(await service.isEmailAvailable("novo@radar.com")).toBe(true);
    });

    it("retorna false se já existe", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "existente" });
      expect(await service.isEmailAvailable("existente@radar.com")).toBe(false);
    });

    it("normaliza email pra lowercase + trim", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await service.isEmailAvailable("  Foo@BAR.com  ");
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "foo@bar.com" },
        select: { id: true },
      });
    });
  });

  describe("isCpfAvailable", () => {
    it("retorna false se cpf inválido", async () => {
      expect(await service.isCpfAvailable("111.111.111-11")).toBe(false);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("retorna true se válido e não existente", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      expect(await service.isCpfAvailable(VALID_CPF)).toBe(true);
    });

    it("retorna false se válido mas já cadastrado", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "existente" });
      expect(await service.isCpfAvailable(VALID_CPF)).toBe(false);
    });
  });
});
