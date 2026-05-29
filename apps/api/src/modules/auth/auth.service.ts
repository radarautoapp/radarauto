/**
 * AuthService
 *
 * Propósito: regra de negócio de autenticação (Regras 6, 7).
 * Lógica pura aqui — controller só orquestra.
 *
 * Segurança:
 *   - Senha hasheada com argon2id (Regra 29)
 *   - Mensagens de erro genéricas em falha de login (não vaza se email existe)
 *   - Sessão multi-device: cada login cria nova session sem invalidar outras
 *   - Tokens com sessionId obrigatório (revogação imediata)
 *   - PII (email, senha) nunca em log (Regras 28, 29)
 *
 * Multi-sessão: login não invalida sessões existentes do mesmo user.
 * Logout específico = revoga 1 session. "Sair de todos" = revoga todas.
 */
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { JwtService } from "@nestjs/jwt";
import { Plan, User, UserRole } from "@prisma/client";
import * as argon2 from "argon2";

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
  expiresAt: Date;
  sessionId: string;
  user: SafeUser;
}

export type SafeUser = Omit<User, "passwordHash">;

@Injectable()
export class AuthService {
  private readonly sessionTtlDays = 7;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async registerRevendedor(dto: RegisterRevendedorDto, ctx: AuthContext): Promise<AuthResult> {
    await this.ensureEmailAvailable(dto.email);
    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        role: UserRole.revendedor,
        plan: Plan.free,
      },
    });

    return this.createSessionAndIssueToken(user, ctx);
  }

  async registerLojista(dto: RegisterLojistaDto, ctx: AuthContext): Promise<AuthResult> {
    await this.ensureEmailAvailable(dto.email);
    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: dto.storeName,
          initials: this.buildInitials(dto.storeName),
          phone: dto.storePhone,
          city: dto.storeCity,
          state: dto.storeState.toUpperCase(),
          since: new Date().getFullYear(),
        },
      });

      return tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          name: dto.name,
          role: UserRole.lojista,
          plan: Plan.free,
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

    // Mensagem genérica pra não vazar se email existe (Regra 5)
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

  private async hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, { type: argon2.argon2id });
  }

  private async createSessionAndIssueToken(user: User, ctx: AuthContext): Promise<AuthResult> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.sessionTtlDays);

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent ?? null,
        deviceLabel: ctx.deviceLabel ?? null,
        expiresAt,
      },
    });

    const payload: AuthTokenPayload = { sub: user.id, sid: session.id, role: user.role };
    const token = await this.jwt.signAsync(payload);

    return {
      token,
      expiresAt,
      sessionId: session.id,
      user: this.stripPassword(user),
    };
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
}
