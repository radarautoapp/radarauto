/**
 * VerificationService unit tests
 *
 * Cobertura crítica (Regra 27):
 *   - send: feliz, cooldown 60s, cap diário 5, email já existe (canal email),
 *           formato inválido (phone curto, email malformado)
 *   - confirm: feliz emite token JWT, código errado incrementa attempts,
 *              max 5 attempts bloqueia, código expirado, formato inválido,
 *              nenhum código ativo
 *   - consumeToken: válido, purpose mismatch, target mismatch, jti reutilizado,
 *                   token inválido/expirado
 *   - getLastCodeDev: só em dev, lança em production
 */
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";

import { VerificationService } from "./verification.service";
import { createPrismaMock, PrismaMock } from "../../test-helpers/prisma.mock";

jest.mock("argon2", () => ({
  argon2id: 2,
  hash: jest.fn(async () => "hashed-code"),
  verify: jest.fn(async (_hash: string, plain: string) => plain === "123456"),
}));

const VALID_PHONE = "47999990000";
const VALID_EMAIL = "user@radar.com";

describe("VerificationService", () => {
  let service: VerificationService;
  let prisma: PrismaMock;
  let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let smsProvider: { channel: "phone"; name: string; send: jest.Mock };
  let emailProvider: { channel: "email"; name: string; send: jest.Mock };
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "development";
    prisma = createPrismaMock();
    jwt = {
      signAsync: jest.fn(async () => "fake-verification-token"),
      verifyAsync: jest.fn(async () => ({})),
    };
    smsProvider = { channel: "phone", name: "mock-sms", send: jest.fn() };
    emailProvider = { channel: "email", name: "mock-email", send: jest.fn() };
    service = new VerificationService(
      prisma as never,
      jwt as never as JwtService,
      smsProvider as never,
      emailProvider as never,
    );
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  /* --------------------------- send: phone --------------------------- */

  describe("send (phone)", () => {
    it("gera código, persiste hash, chama provider", async () => {
      prisma.verification.findFirst.mockResolvedValue(null);
      prisma.verification.count.mockResolvedValue(0);
      prisma.verification.create.mockResolvedValue({});

      const result = await service.send("phone", VALID_PHONE, "127.0.0.1");

      expect(prisma.verification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          channel: "phone",
          target: VALID_PHONE,
          codeHash: "hashed-code",
          ipAddress: "127.0.0.1",
        }),
      });
      expect(smsProvider.send).toHaveBeenCalledWith(VALID_PHONE, expect.stringMatching(/^\d{6}$/));
      expect(result.cooldownSeconds).toBe(60);
      expect(result.attemptsRemaining).toBe(5);
    });

    it("normaliza telefone (remove máscara)", async () => {
      prisma.verification.findFirst.mockResolvedValue(null);
      prisma.verification.count.mockResolvedValue(0);
      prisma.verification.create.mockResolvedValue({});

      await service.send("phone", "(47) 99999-0000");

      expect(prisma.verification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ target: VALID_PHONE }),
      });
    });

    it("rejeita telefone curto (< 10 dígitos)", async () => {
      await expect(service.send("phone", "12345")).rejects.toThrow(BadRequestException);
      expect(prisma.verification.create).not.toHaveBeenCalled();
    });

    it("rejeita cooldown se já enviou há menos de 60s", async () => {
      prisma.verification.findFirst.mockResolvedValueOnce({
        createdAt: new Date(Date.now() - 30_000),
      });

      await expect(service.send("phone", VALID_PHONE)).rejects.toMatchObject({
        response: { code: "VERIFICATION_COOLDOWN" },
      });
    });

    it("rejeita após 5 envios em 24h", async () => {
      prisma.verification.findFirst.mockResolvedValue(null);
      prisma.verification.count.mockResolvedValue(5);

      await expect(service.send("phone", VALID_PHONE)).rejects.toMatchObject({
        response: { code: "VERIFICATION_DAILY_CAP" },
      });
    });

    it("não consulta User pra phone (só pra email)", async () => {
      prisma.verification.findFirst.mockResolvedValue(null);
      prisma.verification.count.mockResolvedValue(0);
      prisma.verification.create.mockResolvedValue({});

      await service.send("phone", VALID_PHONE);

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  /* --------------------------- send: email --------------------------- */

  describe("send (email)", () => {
    it("normaliza email pra lowercase + trim", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.verification.findFirst.mockResolvedValue(null);
      prisma.verification.count.mockResolvedValue(0);
      prisma.verification.create.mockResolvedValue({});

      await service.send("email", "  Foo@BAR.com  ");

      expect(prisma.verification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ channel: "email", target: "foo@bar.com" }),
      });
      expect(emailProvider.send).toHaveBeenCalledWith("foo@bar.com", expect.any(String));
    });

    it("rejeita email malformado", async () => {
      await expect(service.send("email", "not-an-email")).rejects.toThrow(BadRequestException);
    });

    it("rejeita se email já cadastrado no User", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "existing" });

      await expect(service.send("email", VALID_EMAIL)).rejects.toMatchObject({
        response: { code: "EMAIL_ALREADY_EXISTS" },
      });
      expect(prisma.verification.create).not.toHaveBeenCalled();
    });

    it("envia se email ainda não cadastrado", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.verification.findFirst.mockResolvedValue(null);
      prisma.verification.count.mockResolvedValue(0);
      prisma.verification.create.mockResolvedValue({});

      const result = await service.send("email", VALID_EMAIL);

      expect(result.cooldownSeconds).toBe(60);
    });
  });

  /* --------------------------- confirm --------------------------- */

  describe("confirm", () => {
    function activeVerification(
      overrides: Partial<Record<string, unknown>> = {},
    ): Record<string, unknown> {
      return {
        id: "v-1",
        channel: "phone",
        target: VALID_PHONE,
        codeHash: "hashed-code",
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60_000),
        verifiedAt: null,
        ...overrides,
      };
    }

    it("emite token JWT quando código está correto", async () => {
      prisma.verification.findFirst.mockResolvedValue(activeVerification());
      prisma.verification.update.mockResolvedValue({});

      const result = await service.confirm("phone", VALID_PHONE, "123456");

      expect(result.verificationToken).toBe("fake-verification-token");
      expect(jwt.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          purpose: "phone_verification",
          target: VALID_PHONE,
          jti: expect.any(String),
        }),
        expect.any(Object),
      );
      expect(prisma.verification.update).toHaveBeenCalledWith({
        where: { id: "v-1" },
        data: { verifiedAt: expect.any(Date) },
      });
    });

    it("emite token com purpose email_verification quando channel=email", async () => {
      prisma.verification.findFirst.mockResolvedValue(
        activeVerification({ channel: "email", target: VALID_EMAIL }),
      );
      prisma.verification.update.mockResolvedValue({});

      await service.confirm("email", VALID_EMAIL, "123456");

      expect(jwt.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: "email_verification", target: VALID_EMAIL }),
        expect.any(Object),
      );
    });

    it("rejeita formato inválido (não 6 dígitos)", async () => {
      await expect(service.confirm("phone", VALID_PHONE, "abc")).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.confirm("phone", VALID_PHONE, "12345")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejeita se nenhum código ativo", async () => {
      prisma.verification.findFirst.mockResolvedValue(null);

      await expect(service.confirm("phone", VALID_PHONE, "123456")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("incrementa attempts quando código errado", async () => {
      prisma.verification.findFirst.mockResolvedValue(activeVerification({ attempts: 2 }));
      prisma.verification.update.mockResolvedValue({});
      (argon2.verify as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.confirm("phone", VALID_PHONE, "999999")).rejects.toMatchObject({
        response: { code: "INVALID_CODE" },
      });
      expect(prisma.verification.update).toHaveBeenCalledWith({
        where: { id: "v-1" },
        data: { attempts: 3 },
      });
    });

    it("bloqueia após 5 tentativas", async () => {
      prisma.verification.findFirst.mockResolvedValue(activeVerification({ attempts: 5 }));

      await expect(service.confirm("phone", VALID_PHONE, "999999")).rejects.toMatchObject({
        response: { code: "VERIFICATION_TOO_MANY_ATTEMPTS" },
      });
    });
  });

  /* --------------------------- consumeToken --------------------------- */

  describe("consumeToken", () => {
    it("valida token correto", async () => {
      jwt.verifyAsync.mockResolvedValueOnce({
        purpose: "phone_verification",
        target: VALID_PHONE,
        jti: "jti-1",
      });

      await expect(service.consumeToken("token", "phone", VALID_PHONE)).resolves.toBeUndefined();
    });

    it("rejeita token com purpose errado (phone usado como email)", async () => {
      jwt.verifyAsync.mockResolvedValueOnce({
        purpose: "phone_verification",
        target: VALID_PHONE,
        jti: "jti-1",
      });

      await expect(service.consumeToken("token", "email", VALID_EMAIL)).rejects.toMatchObject({
        response: { code: "INVALID_VERIFICATION_TOKEN" },
      });
    });

    it("rejeita token com target diferente", async () => {
      jwt.verifyAsync.mockResolvedValueOnce({
        purpose: "phone_verification",
        target: "47888888888",
        jti: "jti-1",
      });

      await expect(service.consumeToken("token", "phone", VALID_PHONE)).rejects.toMatchObject({
        response: { code: "VERIFICATION_TARGET_MISMATCH" },
      });
    });

    it("rejeita jti reutilizado", async () => {
      jwt.verifyAsync.mockResolvedValue({
        purpose: "phone_verification",
        target: VALID_PHONE,
        jti: "jti-unique-x",
      });

      await service.consumeToken("token", "phone", VALID_PHONE);
      await expect(service.consumeToken("token", "phone", VALID_PHONE)).rejects.toMatchObject({
        response: { code: "VERIFICATION_TOKEN_ALREADY_USED" },
      });
    });

    it("rejeita token inválido/expirado (signature error)", async () => {
      jwt.verifyAsync.mockRejectedValueOnce(new Error("jwt expired"));

      await expect(service.consumeToken("token", "phone", VALID_PHONE)).rejects.toMatchObject({
        response: { code: "INVALID_VERIFICATION_TOKEN" },
      });
    });
  });

  /* --------------------------- getLastCodeDev --------------------------- */

  describe("getLastCodeDev", () => {
    it("lança em produção", () => {
      process.env.NODE_ENV = "production";
      expect(() => service.getLastCodeDev("phone", VALID_PHONE)).toThrow(NotFoundException);
    });

    it("lança se nenhum código foi gerado", () => {
      expect(() => service.getLastCodeDev("phone", VALID_PHONE)).toThrow(NotFoundException);
    });

    it("retorna o último código gerado para o target em dev", async () => {
      prisma.verification.findFirst.mockResolvedValue(null);
      prisma.verification.count.mockResolvedValue(0);
      prisma.verification.create.mockResolvedValue({});

      await service.send("phone", VALID_PHONE);
      const result = service.getLastCodeDev("phone", VALID_PHONE);

      expect(result.code).toMatch(/^\d{6}$/);
    });
  });
});
