/**
 * AuthService — Regras 6, 7.
 *
 * Cadastro público: verificação dupla (email + phone) + CPF único + CNPJ p/ lojista.
 * Todos os campos pessoais (PII) nunca em log (Regra 29).
 */
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Plan, User, UserRole } from "@prisma/client";

import { newUserSubscription } from "../../common/promo";
import * as argon2 from "argon2";
import * as crypto from "crypto";

import { CnpjService } from "../cnpj/cnpj.service";
import { isAutomotiveCnae } from "../cnpj/automotive-cnae";
import { CnpjValidator } from "../cnpj/cnpj.validator";
import { CpfValidator } from "../cpf/cpf.validator";
import { VerificationService } from "../verification/verification.service";
import { PrismaService } from "../../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterFuncionarioDto } from "./dto/register-funcionario.dto";
import { RegisterLojistaDto } from "./dto/register-lojista.dto";
import { RegisterRevendedorDto } from "./dto/register-revendedor.dto";

export interface AuthTokenPayload {
  sub: string;
  sid: string;
  role: UserRole;
}

export interface AuthContext {
  ipAddress?: string;
  userAgent?: string;
  deviceLabel?: string;
}

export interface AuthResult {
  token: string;
  refreshToken: string;
  expiresAt: Date;
  sessionId: string;
  user: SafeUser;
}

export type SafeUser = Omit<User, "passwordHash">;

@Injectable()
export class AuthService {
  private readonly sessionTtlDays = 7;
  private readonly refreshTtlDays = 90;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly cnpjService: CnpjService,
    private readonly verificationService: VerificationService,
  ) {}

  async registerRevendedor(dto: RegisterRevendedorDto, ctx: AuthContext): Promise<AuthResult> {
    await this.verificationService.consumeToken(dto.emailVerificationToken, "email", dto.email);
    if (dto.phoneVerificationToken) {
      await this.verificationService.consumeToken(dto.phoneVerificationToken, "phone", dto.phone);
    }
    await this.ensureEmailAvailable(dto.email);

    const cpf = this.normalizeCpf(dto.cpf);
    await this.ensureCpfValid(cpf);
    await this.ensureCpfAvailable(cpf);

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        phone: this.normalizePhone(dto.phone),
        cpf,
        role: UserRole.revendedor,
        ...newUserSubscription(),
      },
    });

    return this.createSessionAndIssueToken(user, ctx);
  }

  async registerLojista(dto: RegisterLojistaDto, ctx: AuthContext): Promise<AuthResult> {
    await this.verificationService.consumeToken(dto.emailVerificationToken, "email", dto.email);
    if (dto.phoneVerificationToken) {
      await this.verificationService.consumeToken(dto.phoneVerificationToken, "phone", dto.phone);
    }
    await this.ensureEmailAvailable(dto.email);

    const cpf = this.normalizeCpf(dto.cpf);
    await this.ensureCpfValid(cpf);
    await this.ensureCpfAvailable(cpf);

    const cnpj = CnpjValidator.normalize(dto.cnpj);
    if (!CnpjValidator.isValid(cnpj)) {
      throw new ConflictException({
        code: "INVALID_CNPJ_FORMAT",
        message: "CNPJ inválido.",
      });
    }

    const existing = await this.prisma.store.findUnique({ where: { cnpj } });
    if (existing) {
      throw new ConflictException({
        code: "CNPJ_ALREADY_EXISTS",
        message: "Este CNPJ já está cadastrado no RadarAuto.",
      });
    }

    const lookup = await this.cnpjService.lookup(cnpj);

    if (lookup.status !== "ATIVA") {
      throw new ConflictException({
        code: "CNPJ_INACTIVE",
        message: `Este CNPJ não está ativo na Receita Federal (situação: ${lookup.status}).`,
      });
    }

    if (!isAutomotiveCnae(lookup.mainActivityCode, lookup.secondaryActivityCodes)) {
      throw new ConflictException({
        code: "CNPJ_NOT_AUTOMOTIVE",
        message:
          "Este CNPJ não pertence ao ramo automotivo. O RadarAuto é exclusivo para lojas e revendas de veículos.",
      });
    }

    const passwordHash = await this.hashPassword(dto.password);
    const normalizedPhone = this.normalizePhone(dto.phone);

    const user = await this.prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: lookup.tradeName ?? lookup.legalName,
          legalName: lookup.legalName,
          tradeName: lookup.tradeName,
          cnpj,
          initials: this.buildInitials(lookup.tradeName ?? lookup.legalName),
          phone: lookup.phone ?? normalizedPhone,
          whatsapp: normalizedPhone,
          email: lookup.email,
          city: lookup.city,
          state: lookup.state.toUpperCase(),
          since: lookup.openedAt ? this.parseYear(lookup.openedAt) : new Date().getFullYear(),
        },
      });

      return tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          name: dto.name,
          phone: normalizedPhone,
          cpf,
          role: UserRole.lojista,
          ...newUserSubscription(),
          storeId: store.id,
        },
      });
    });

    return this.createSessionAndIssueToken(user, ctx);
  }

  async registerFuncionario(dto: RegisterFuncionarioDto, actor: SafeUser): Promise<SafeUser> {
    if (actor.role !== UserRole.lojista || !actor.storeId) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Apenas lojistas podem cadastrar funcionários.",
      });
    }
    await this.ensureEmailAvailable(dto.email);
    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        phone: "",
        role: UserRole.funcionario,
        plan: Plan.free,
        storeId: actor.storeId,
      },
    });
    return this.stripPassword(user);
  }

  async login(dto: LoginDto, ctx: AuthContext): Promise<AuthResult> {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    const genericError = new UnauthorizedException({
      code: "INVALID_CREDENTIALS",
      message: "Email ou senha incorretos.",
    });

    if (!user || user.deletedAt) throw genericError;
    if (!user.active) {
      throw new ForbiddenException({
        code: "ACCOUNT_DISABLED",
        message: "Conta desativada. Entre em contato com o suporte.",
      });
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException({
        code: "ACCOUNT_NOT_ACTIVATED",
        message: "Conta ainda nao foi ativada. Use o link do convite recebido por email.",
      });
    }
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw genericError;

    return this.createSessionAndIssueToken(user, ctx);
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string): Promise<{ revoked: number }> {
    const result = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { revoked: result.count };
  }

  async validateSession(userId: string, sessionId: string): Promise<SafeUser> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    const invalid = new UnauthorizedException({
      code: "SESSION_INVALID",
      message: "Sessão inválida ou expirada.",
    });

    if (!session) throw invalid;
    if (session.userId !== userId) throw invalid;
    if (session.revokedAt) throw invalid;
    if (session.expiresAt < new Date()) throw invalid;
    if (!session.user || session.user.deletedAt || !session.user.active) throw invalid;

    void this.prisma.session
      .update({ where: { id: sessionId }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);

    return this.stripPassword(session.user);
  }

  async listActiveSessions(userId: string): Promise<
    Array<{
      id: string;
      ipAddress: string | null;
      deviceLabel: string | null;
      lastSeenAt: Date;
      createdAt: Date;
    }>
  > {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, ipAddress: true, deviceLabel: true, lastSeenAt: true, createdAt: true },
      orderBy: { lastSeenAt: "desc" },
    });
  }

  async isEmailAvailable(email: string): Promise<boolean> {
    const exists = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });
    return !exists;
  }

  async isCpfAvailable(rawCpf: string): Promise<boolean> {
    const cpf = this.normalizeCpf(rawCpf);
    if (!CpfValidator.isValid(cpf)) return false;
    const exists = await this.prisma.user.findUnique({
      where: { cpf },
      select: { id: true },
    });
    return !exists;
  }

  private async ensureEmailAvailable(email: string): Promise<void> {
    const exists = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    if (exists) {
      throw new ConflictException({
        code: "EMAIL_ALREADY_EXISTS",
        message: "Este email já está cadastrado.",
      });
    }
  }

  private async ensureCpfValid(cpf: string): Promise<void> {
    if (!CpfValidator.isValid(cpf)) {
      throw new ConflictException({
        code: "INVALID_CPF",
        message: "CPF inválido.",
      });
    }
  }

  private async ensureCpfAvailable(cpf: string): Promise<void> {
    const exists = await this.prisma.user.findUnique({
      where: { cpf },
      select: { id: true },
    });
    if (exists) {
      throw new ConflictException({
        code: "CPF_ALREADY_EXISTS",
        message: "Este CPF já está cadastrado.",
      });
    }
  }

  private normalizeCpf(cpf: string): string {
    return CpfValidator.normalize(cpf);
  }

  private async hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, { type: argon2.argon2id });
  }

  private async createSessionAndIssueToken(user: User, ctx: AuthContext): Promise<AuthResult> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.sessionTtlDays);

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + this.refreshTtlDays);

    // Refresh token: random forte. No banco fica apenas o hash (nunca o valor cru).
    const refreshToken = crypto.randomBytes(48).toString("base64url");
    const refreshTokenHash = await argon2.hash(refreshToken, { type: argon2.argon2id });

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent ?? null,
        deviceLabel: ctx.deviceLabel ?? null,
        expiresAt,
        refreshTokenHash,
        refreshExpiresAt,
      },
    });

    const payload: AuthTokenPayload = { sub: user.id, sid: session.id, role: user.role };
    const token = await this.jwt.signAsync(payload);

    return {
      token,
      refreshToken,
      expiresAt,
      sessionId: session.id,
      user: this.stripPassword(user),
    };
  }

  /**
   * Renova o access token a partir de um refresh token valido.
   * Valida: sessao existe, nao revogada, refresh nao expirado e hash confere.
   * Emite um novo access token (mesmo sid). Nao rotaciona o refresh nesta versao.
   */
  async refreshAccessToken(
    sessionId: string,
    refreshToken: string,
  ): Promise<{ token: string; expiresAt: Date; sessionId: string }> {
    const invalid = new UnauthorizedException({
      code: "REFRESH_INVALID",
      message: "Sessão expirada. Faça login novamente.",
    });

    if (!sessionId || !refreshToken) throw invalid;

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) throw invalid;
    if (session.revokedAt) throw invalid;
    if (!session.refreshTokenHash || !session.refreshExpiresAt) throw invalid;
    if (session.refreshExpiresAt < new Date()) throw invalid;
    if (!session.user || session.user.deletedAt || !session.user.active) throw invalid;

    const ok = await argon2.verify(session.refreshTokenHash, refreshToken).catch(() => false);
    if (!ok) throw invalid;

    // novo access token; estende a validade da sessao (sliding) ate o limite do refresh
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.sessionTtlDays);
    const cappedExpiresAt =
      expiresAt > session.refreshExpiresAt ? session.refreshExpiresAt : expiresAt;

    await this.prisma.session
      .update({
        where: { id: session.id },
        data: { expiresAt: cappedExpiresAt, lastSeenAt: new Date() },
      })
      .catch(() => undefined);

    const payload: AuthTokenPayload = {
      sub: session.userId,
      sid: session.id,
      role: session.user.role,
    };
    const token = await this.jwt.signAsync(payload);

    return { token, expiresAt: cappedExpiresAt, sessionId: session.id };
  }

  private stripPassword(user: User): SafeUser {
    const { passwordHash: _ph, ...safe } = user as User & Record<string, unknown>;
    return safe as SafeUser;
  }

  private buildInitials(name: string): string {
    const words = name.trim().split(/\s+/);
    const first = words[0]?.[0] ?? "";
    const second = words[1]?.[0] ?? words[0]?.[1] ?? "";
    return (first + second).toUpperCase();
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "");
  }

  private parseYear(dateStr: string): number {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const year = dateStr.split("/")[2];
      const parsed = year ? Number(year) : NaN;
      if (!Number.isNaN(parsed)) return parsed;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const year = dateStr.split("-")[0];
      const parsed = year ? Number(year) : NaN;
      if (!Number.isNaN(parsed)) return parsed;
    }
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  }
}
