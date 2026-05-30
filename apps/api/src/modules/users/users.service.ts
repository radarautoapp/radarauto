/**
 * UsersService
 *
 * Operações no User autenticado (perfil próprio).
 * Regras:
 *  - Email e CPF NÃO editáveis (MVP) - se vier no DTO, ignora
 *  - Phone editável SE acompanhar phoneVerificationToken válido pro novo número
 *  - Senha trocada com validação da senha atual + revoga outras sessões
 *  - Audit log via pino (PII redactada)
 */
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Logger } from "@nestjs/common";
import { User } from "@prisma/client";
import * as argon2 from "argon2";

import { VerificationService } from "../verification/verification.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";

export type SafeUser = Omit<User, "passwordHash">;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verificationService: VerificationService,
  ) {}

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<SafeUser> {
    const data: Partial<{ name: string; phone: string }> = {};

    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      if (trimmed.length >= 2) data.name = trimmed;
    }

    if (dto.phone !== undefined && dto.phoneVerificationToken) {
      await this.verificationService.consumeToken(dto.phoneVerificationToken, "phone", dto.phone);
      data.phone = dto.phone.replace(/\D/g, "");
    }

    if (Object.keys(data).length === 0) {
      const current = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
      return this.stripPassword(current);
    }

    const updated = await this.prisma.user.update({ where: { id: userId }, data });
    this.logger.log({ msg: "user.profile.updated", userId, fields: Object.keys(data) });
    return this.stripPassword(updated);
  }

  async changePassword(
    userId: string,
    currentSessionId: string,
    dto: ChangePasswordDto,
  ): Promise<{ revokedSessions: number }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (!user.passwordHash) {
      throw new UnauthorizedException({
        code: "INVALID_CURRENT_PASSWORD",
        message: "Senha atual incorreta.",
      });
    }
    const ok = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!ok) {
      throw new UnauthorizedException({
        code: "INVALID_CURRENT_PASSWORD",
        message: "Senha atual incorreta.",
      });
    }

    const newHash = await argon2.hash(dto.newPassword, { type: argon2.argon2id });

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
      const revoke = await tx.session.updateMany({
        where: { userId, revokedAt: null, id: { not: currentSessionId } },
        data: { revokedAt: new Date() },
      });
      return revoke.count;
    });

    this.logger.log({
      msg: "user.password.changed",
      userId,
      revokedOtherSessions: result,
    });

    return { revokedSessions: result };
  }

  private stripPassword(user: User): SafeUser {
    const { passwordHash: _ph, ...safe } = user as User & Record<string, unknown>;
    return safe as SafeUser;
  }
}
