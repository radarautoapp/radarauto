/**
 * EmployeesService
 *
 * Gestão de funcionários da loja (lojista convida, funcionário ativa).
 *
 * Regras:
 *  - Só lojista (role + storeId) pode convidar/remover funcionários
 *  - Email único globalmente — se já existe outro user, recusa
 *  - Convite gera User com status=PENDING_ACTIVATION + EmployeeInvite (token 7 dias)
 *  - Reenvio invalida convites anteriores e cria novo (mantém histórico)
 *  - Ativação: cria senha + status=ACTIVE + marca usedAt no invite
 *  - Remoção: soft delete + revoga sessões + libera email pra reuso
 */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmployeeInvite, User, UserRole, UserStatus } from "@prisma/client";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";

import { PrismaService } from "../../prisma/prisma.service";
import { SafeUser } from "../auth/auth.service";
import { EMAIL_SERVICE, IEmailService } from "../email/email.interface";

const INVITE_EXPIRATION_DAYS = 7;
const INVITE_TOKEN_BYTES = 32;
const PASSWORD_MIN_LENGTH = 8;

export interface InvitedEmployee {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  createdAt: Date;
  invite?: {
    expiresAt: Date;
    usedAt: Date | null;
  };
}

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(EMAIL_SERVICE) private readonly email: IEmailService,
  ) {}

  // ─── Lojista ────────────────────────────────────────────────────────────

  async list(actor: SafeUser): Promise<InvitedEmployee[]> {
    this.assertIsOwner(actor);
    const employees = await this.prisma.user.findMany({
      where: {
        storeId: actor.storeId!,
        role: UserRole.funcionario,
        deletedAt: null,
      },
      include: {
        employeeInvites: {
          where: { usedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return employees.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      status: u.status,
      createdAt: u.createdAt,
      invite: u.employeeInvites[0]
        ? {
            expiresAt: u.employeeInvites[0].expiresAt,
            usedAt: u.employeeInvites[0].usedAt,
          }
        : undefined,
    }));
  }

  async invite(actor: SafeUser, email: string): Promise<InvitedEmployee> {
    this.assertIsOwner(actor);
    const normalized = email.trim().toLowerCase();

    // Email único globalmente
    const existing = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    if (existing && !existing.deletedAt) {
      throw new ConflictException({
        code: "EMAIL_ALREADY_EXISTS",
        message: "Este email já está cadastrado em outra conta.",
      });
    }

    // Cria User PENDING + invite numa transação
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRATION_DAYS);

    const { user, invite } = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: normalized,
          name: normalized.split("@")[0]!, // placeholder, funcionário define no aceite
          role: UserRole.funcionario,
          status: UserStatus.PENDING_ACTIVATION,
          storeId: actor.storeId!,
          invitedById: actor.id,
        },
      });
      const inv = await tx.employeeInvite.create({
        data: { token, userId: u.id, expiresAt },
      });
      return { user: u, invite: inv };
    });

    await this.sendInviteEmail(user, invite, actor);

    this.logger.log({
      msg: "employee.invited",
      employeeId: user.id,
      email: normalized,
      invitedBy: actor.id,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      createdAt: user.createdAt,
      invite: { expiresAt: invite.expiresAt, usedAt: null },
    };
  }

  async resendInvite(actor: SafeUser, employeeId: string): Promise<InvitedEmployee> {
    this.assertIsOwner(actor);

    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
    });
    if (
      !employee ||
      employee.storeId !== actor.storeId ||
      employee.deletedAt ||
      employee.role !== UserRole.funcionario
    ) {
      throw new NotFoundException({
        code: "EMPLOYEE_NOT_FOUND",
        message: "Funcionário não encontrado.",
      });
    }
    if (employee.status !== UserStatus.PENDING_ACTIVATION) {
      throw new BadRequestException({
        code: "EMPLOYEE_ALREADY_ACTIVE",
        message: "Esse funcionário já ativou a conta.",
      });
    }

    // Invalida convites anteriores não usados (mantém histórico marcando usedAt)
    await this.prisma.employeeInvite.updateMany({
      where: { userId: employee.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRATION_DAYS);

    const invite = await this.prisma.employeeInvite.create({
      data: { token, userId: employee.id, expiresAt },
    });

    await this.sendInviteEmail(employee, invite, actor);

    this.logger.log({
      msg: "employee.invite.resent",
      employeeId: employee.id,
      invitedBy: actor.id,
    });

    return {
      id: employee.id,
      email: employee.email,
      name: employee.name,
      status: employee.status,
      createdAt: employee.createdAt,
      invite: { expiresAt: invite.expiresAt, usedAt: null },
    };
  }

  async remove(actor: SafeUser, employeeId: string): Promise<void> {
    this.assertIsOwner(actor);

    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
    });
    if (
      !employee ||
      employee.storeId !== actor.storeId ||
      employee.deletedAt ||
      employee.role !== UserRole.funcionario
    ) {
      throw new NotFoundException({
        code: "EMPLOYEE_NOT_FOUND",
        message: "Funcionário não encontrado.",
      });
    }

    // Soft delete + libera email pra reuso + revoga sessões
    const archivedEmail = `${employee.email}+deleted-${Date.now()}@radar.archive`;
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: employee.id },
        data: {
          deletedAt: new Date(),
          email: archivedEmail,
        },
      }),
      this.prisma.session.updateMany({
        where: { userId: employee.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      // Invites pendentes ficam sem uso
      this.prisma.employeeInvite.updateMany({
        where: { userId: employee.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    this.logger.log({
      msg: "employee.removed",
      employeeId: employee.id,
      removedBy: actor.id,
    });
  }

  // ─── Convite (público, sem auth) ────────────────────────────────────────

  async getInviteByToken(token: string): Promise<{
    email: string;
    storeName: string;
    expiresAt: Date;
  }> {
    const invite = await this.findValidInvite(token);
    const store = await this.prisma.store.findUnique({
      where: { id: invite.user.storeId! },
    });
    return {
      email: invite.user.email,
      storeName: store?.name ?? "uma loja",
      expiresAt: invite.expiresAt,
    };
  }

  async acceptInvite(
    token: string,
    payload: { name: string; password: string; phone?: string },
  ): Promise<{ userId: string }> {
    const invite = await this.findValidInvite(token);

    const name = payload.name.trim();
    if (name.length < 2) {
      throw new BadRequestException({
        code: "INVALID_NAME",
        message: "Nome inválido.",
      });
    }
    if (payload.password.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException({
        code: "INVALID_PASSWORD",
        message: `Senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
      });
    }

    const passwordHash = await argon2.hash(payload.password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: invite.userId },
        data: {
          name,
          passwordHash,
          phone: payload.phone ? payload.phone.replace(/\D/g, "") : null,
          status: UserStatus.ACTIVE,
        },
      }),
      this.prisma.employeeInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      }),
    ]);

    this.logger.log({
      msg: "employee.invite.accepted",
      employeeId: invite.userId,
    });

    return { userId: invite.userId };
  }

  // ─── Privados ──────────────────────────────────────────────────────────

  private async findValidInvite(token: string): Promise<EmployeeInvite & { user: User }> {
    const invite = await this.prisma.employeeInvite.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!invite) {
      throw new NotFoundException({
        code: "INVITE_NOT_FOUND",
        message: "Convite inválido.",
      });
    }
    if (invite.usedAt) {
      throw new BadRequestException({
        code: "INVITE_ALREADY_USED",
        message: "Este convite já foi usado.",
      });
    }
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException({
        code: "INVITE_EXPIRED",
        message: "Este convite expirou. Peça pra loja enviar um novo.",
      });
    }
    if (invite.user.deletedAt) {
      throw new NotFoundException({
        code: "INVITE_NOT_FOUND",
        message: "Convite inválido.",
      });
    }
    return invite;
  }

  private assertIsOwner(actor: SafeUser): void {
    if (actor.role !== UserRole.lojista || !actor.storeId) {
      throw new ForbiddenException({
        code: "STORE_ACCESS_DENIED",
        message: "Apenas o lojista pode gerenciar funcionários.",
      });
    }
  }

  private async sendInviteEmail(
    employee: User,
    invite: EmployeeInvite,
    actor: SafeUser,
  ): Promise<void> {
    const baseUrl = this.config.get<string>("WEB_BASE_URL") ?? "http://localhost:3000";
    const link = `${baseUrl}/convite/${invite.token}`;
    const store = await this.prisma.store.findUnique({
      where: { id: actor.storeId! },
    });
    const storeName = store?.name ?? "uma loja";

    const subject = `Você foi convidado pra trabalhar na ${storeName}`;
    const text = `Olá!

${actor.name} convidou você pra fazer parte da equipe da ${storeName} no RadarAuto.

Acesse o link abaixo pra criar sua senha e ativar sua conta (válido por ${INVITE_EXPIRATION_DAYS} dias):

${link}

Se você não esperava esse convite, pode ignorar este email.

— Equipe RadarAuto`;

    const html = `<!doctype html>
<html lang="pt-BR">
<body style="font-family: system-ui, -apple-system, sans-serif; background: #f5f7fb; padding: 32px 16px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
    <h1 style="margin: 0 0 16px; font-size: 22px; color: #0f172a;">Você foi convidado pra ${storeName}</h1>
    <p style="margin: 0 0 16px; color: #475569; line-height: 1.6;">
      <strong>${actor.name}</strong> convidou você pra fazer parte da equipe no RadarAuto.
    </p>
    <p style="margin: 0 0 24px; color: #475569; line-height: 1.6;">
      Clique no botão abaixo pra criar sua senha e ativar sua conta. O link expira em ${INVITE_EXPIRATION_DAYS} dias.
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${link}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Aceitar convite
      </a>
    </div>
    <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">
      Ou copie esse link no navegador:
    </p>
    <p style="margin: 0 0 24px; color: #2563eb; font-size: 13px; word-break: break-all;">
      ${link}
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
      Se você não esperava esse convite, pode ignorar este email com segurança.
    </p>
  </div>
</body>
</html>`;

    await this.email.send({ to: employee.email, subject, text, html });
  }
}

function generateToken(): string {
  return randomBytes(INVITE_TOKEN_BYTES).toString("base64url");
}
