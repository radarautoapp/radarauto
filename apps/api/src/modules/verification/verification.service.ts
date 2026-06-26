/**
 * VerificationService
 *
 * Serviço genérico de verificação por código.
 * Funciona pra ambos os canais (email e phone) — o caller especifica o channel.
 *
 * Segurança:
 *   - Código 6 dígitos numéricos via crypto.randomInt
 *   - Hash argon2id antes de persistir (NUNCA em texto puro — Regra 29)
 *   - Cooldown 60s entre envios pro mesmo target+channel
 *   - Cap diário 5 códigos/target+channel
 *   - Max 5 tentativas por código (depois invalida)
 *   - Expira em 10 minutos
 *   - Pré-check de email único antes de gastar email (UX rápida + economia)
 *
 * Token de prova:
 *   - JWT assinado com JWT_SECRET
 *   - TTL 30 minutos
 *   - jti único, marcado como usado após consumo no register
 *   - Claims: { purpose: "email_verification" | "phone_verification", target, jti }
 */
import {
  Inject,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { VerificationChannel } from "@prisma/client";
import * as argon2 from "argon2";
import { randomInt, randomUUID } from "crypto";

import { PrismaService } from "../../prisma/prisma.service";
import { EMAIL_VERIFICATION_SENDER } from "./providers/email-verification.token";
import { MockSmsProvider } from "./providers/mock-sms.provider";
import { VerificationProvider } from "./providers/verification-provider.interface";

interface SendResult {
  expiresAt: Date;
  cooldownSeconds: number;
  attemptsRemaining: number;
}

interface ConfirmResult {
  verificationToken: string;
  expiresAt: Date;
}

interface VerificationTokenPayload {
  purpose: "email_verification" | "phone_verification";
  target: string;
  jti: string;
}

@Injectable()
export class VerificationService {
  private readonly codeTtlMs = 10 * 60 * 1000;
  private readonly cooldownMs = 60 * 1000;
  private readonly maxPerDay = 5;
  private readonly maxAttempts = 5;
  private readonly tokenTtlSeconds = 30 * 60;
  private readonly usedJtis = new Set<string>();

  private lastCodeByTarget = new Map<string, { code: string; expiresAt: Date }>();

  private readonly providers: Record<VerificationChannel, VerificationProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    smsProvider: MockSmsProvider,
    @Inject(EMAIL_VERIFICATION_SENDER) emailProvider: VerificationProvider,
  ) {
    this.providers = {
      phone: smsProvider,
      email: emailProvider,
    };
  }

  async send(
    channel: VerificationChannel,
    rawTarget: string,
    ipAddress?: string,
  ): Promise<SendResult> {
    const target = this.normalize(channel, rawTarget);
    this.assertValidTarget(channel, target);

    if (channel === "email") {
      await this.assertEmailAvailable(target);
    }

    await this.assertCooldown(channel, target);
    await this.assertDailyCap(channel, target);

    const code = this.generateCode();
    const codeHash = await argon2.hash(code, { type: argon2.argon2id });
    const expiresAt = new Date(Date.now() + this.codeTtlMs);

    await this.prisma.verification.create({
      data: {
        channel,
        target,
        codeHash,
        expiresAt,
        ipAddress: ipAddress ?? null,
      },
    });

    if (process.env.NODE_ENV !== "production") {
      this.lastCodeByTarget.set(`${channel}:${target}`, { code, expiresAt });
    }

    await this.providers[channel].send(target, code);

    return {
      expiresAt,
      cooldownSeconds: Math.ceil(this.cooldownMs / 1000),
      attemptsRemaining: this.maxAttempts,
    };
  }

  async confirm(
    channel: VerificationChannel,
    rawTarget: string,
    code: string,
  ): Promise<ConfirmResult> {
    const target = this.normalize(channel, rawTarget);
    this.assertValidTarget(channel, target);

    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException({
        code: "INVALID_CODE_FORMAT",
        message: "O código deve ter 6 dígitos.",
      });
    }

    const verification = await this.prisma.verification.findFirst({
      where: {
        channel,
        target,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      throw new NotFoundException({
        code: "VERIFICATION_NOT_FOUND",
        message: "Nenhum código ativo. Solicite um novo.",
      });
    }

    if (verification.attempts >= this.maxAttempts) {
      throw new HttpException(
        {
          code: "VERIFICATION_TOO_MANY_ATTEMPTS",
          message: "Muitas tentativas. Solicite um novo código.",
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const ok = await argon2.verify(verification.codeHash, code);
    if (!ok) {
      await this.prisma.verification.update({
        where: { id: verification.id },
        data: { attempts: verification.attempts + 1 },
      });
      throw new BadRequestException({
        code: "INVALID_CODE",
        message: `Código incorreto. Tentativas restantes: ${this.maxAttempts - verification.attempts - 1}.`,
      });
    }

    await this.prisma.verification.update({
      where: { id: verification.id },
      data: { verifiedAt: new Date() },
    });

    const jti = randomUUID();
    const purpose = channel === "email" ? "email_verification" : "phone_verification";
    const payload: VerificationTokenPayload = { purpose, target, jti };
    const token = await this.jwt.signAsync(payload, {
      expiresIn: this.tokenTtlSeconds,
    });
    const tokenExpiresAt = new Date(Date.now() + this.tokenTtlSeconds * 1000);

    if (process.env.NODE_ENV !== "production") {
      this.lastCodeByTarget.delete(`${channel}:${target}`);
    }

    return { verificationToken: token, expiresAt: tokenExpiresAt };
  }

  /**
   * Consome um token previamente emitido.
   * Valida que: assinatura ok, propósito bate com o canal esperado,
   * target bate com o esperado, e jti ainda não foi usado.
   */
  async consumeToken(
    token: string,
    expectedChannel: VerificationChannel,
    expectedRawTarget: string,
  ): Promise<void> {
    const expectedTarget = this.normalize(expectedChannel, expectedRawTarget);
    const expectedPurpose =
      expectedChannel === "email" ? "email_verification" : "phone_verification";

    let payload: VerificationTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<VerificationTokenPayload>(token);
    } catch {
      throw new ConflictException({
        code: "INVALID_VERIFICATION_TOKEN",
        message: `Verificação de ${expectedChannel === "email" ? "email" : "telefone"} expirada ou inválida.`,
      });
    }
    if (payload.purpose !== expectedPurpose) {
      throw new ConflictException({
        code: "INVALID_VERIFICATION_TOKEN",
        message: "Token de verificação inválido.",
      });
    }
    if (payload.target !== expectedTarget) {
      throw new ConflictException({
        code: "VERIFICATION_TARGET_MISMATCH",
        message: `O ${expectedChannel === "email" ? "email" : "telefone"} verificado é diferente do informado no cadastro.`,
      });
    }
    if (this.usedJtis.has(payload.jti)) {
      throw new ConflictException({
        code: "VERIFICATION_TOKEN_ALREADY_USED",
        message: "Esse comprovante já foi usado. Refaça a verificação.",
      });
    }
    this.usedJtis.add(payload.jti);
    if (this.usedJtis.size > 10_000) {
      const first = this.usedJtis.values().next().value;
      if (first) this.usedJtis.delete(first);
    }
  }

  /**
   * DEV-ONLY: retorna o último código gerado pra um (channel, target).
   */
  getLastCodeDev(
    channel: VerificationChannel,
    rawTarget: string,
  ): { code: string; expiresAt: Date } {
    if (process.env.NODE_ENV === "production") {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Endpoint não disponível.",
      });
    }
    const target = this.normalize(channel, rawTarget);
    const entry = this.lastCodeByTarget.get(`${channel}:${target}`);
    if (!entry || entry.expiresAt < new Date()) {
      throw new NotFoundException({
        code: "VERIFICATION_NOT_FOUND",
        message: "Nenhum código ativo.",
      });
    }
    return entry;
  }

  /* --------------------------- helpers --------------------------- */

  private normalize(channel: VerificationChannel, target: string): string {
    const t = (target ?? "").trim();
    if (channel === "email") return t.toLowerCase();
    return t.replace(/\D/g, "");
  }

  private assertValidTarget(channel: VerificationChannel, target: string): void {
    if (channel === "phone") {
      if (target.length < 10 || target.length > 13) {
        throw new BadRequestException({
          code: "INVALID_PHONE",
          message: "Telefone inválido. Use formato com DDD.",
        });
      }
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      throw new BadRequestException({
        code: "INVALID_EMAIL",
        message: "Email inválido.",
      });
    }
  }

  private async assertEmailAvailable(email: string): Promise<void> {
    const exists = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (exists) {
      throw new ConflictException({
        code: "EMAIL_ALREADY_EXISTS",
        message: "Este email já está cadastrado.",
      });
    }
  }

  private async assertCooldown(channel: VerificationChannel, target: string): Promise<void> {
    const cutoff = new Date(Date.now() - this.cooldownMs);
    const recent = await this.prisma.verification.findFirst({
      where: { channel, target, createdAt: { gt: cutoff } },
      orderBy: { createdAt: "desc" },
    });
    if (recent) {
      const elapsed = Date.now() - recent.createdAt.getTime();
      const remaining = Math.ceil((this.cooldownMs - elapsed) / 1000);
      throw new HttpException(
        {
          code: "VERIFICATION_COOLDOWN",
          message: `Aguarde ${remaining} segundos antes de pedir um novo código.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async assertDailyCap(channel: VerificationChannel, target: string): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await this.prisma.verification.count({
      where: { channel, target, createdAt: { gt: cutoff } },
    });
    if (count >= this.maxPerDay) {
      throw new HttpException(
        {
          code: "VERIFICATION_DAILY_CAP",
          message: "Limite diário de códigos atingido. Tente novamente amanhã.",
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private generateCode(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, "0");
  }
}
