/**
 * StoresService
 *
 * Operações na loja do user autenticado.
 * Regras:
 *  - Só lojista (role) com storeId pode editar
 *  - cnpj, legalName, tradeName, city, state, since vêm da Receita → não editáveis
 *  - name (display) editável; initials recalculadas automaticamente
 *  - phone e whatsapp exigem token de verificação SMS pra novo número
 *  - email e description editáveis direto
 */
import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Store } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { SafeUser } from "../auth/auth.service";
import { VerificationService } from "../verification/verification.service";
import { UpdateStoreDto } from "./dto/update-store.dto";

@Injectable()
export class StoresService {
  private readonly logger = new Logger(StoresService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verificationService: VerificationService,
  ) {}

  async getMine(user: SafeUser): Promise<Store> {
    this.assertCanManage(user);
    const store = await this.prisma.store.findUnique({
      where: { id: user.storeId! },
    });
    if (!store) {
      throw new NotFoundException({
        code: "STORE_NOT_FOUND",
        message: "Loja não encontrada.",
      });
    }
    return store;
  }

  async updateMine(user: SafeUser, dto: UpdateStoreDto): Promise<Store> {
    this.assertCanManage(user);
    const storeId = user.storeId!;

    const data: Partial<{
      name: string;
      initials: string;
      phone: string;
      whatsapp: string;
      email: string | null;
      description: string | null;
    }> = {};

    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      if (trimmed.length >= 2) {
        data.name = trimmed;
        data.initials = computeInitials(trimmed);
      }
    }

    if (dto.phone !== undefined && dto.phoneVerificationToken) {
      await this.verificationService.consumeToken(dto.phoneVerificationToken, "phone", dto.phone);
      data.phone = dto.phone.replace(/\D/g, "");
    }

    if (dto.whatsapp !== undefined && dto.whatsappVerificationToken) {
      await this.verificationService.consumeToken(
        dto.whatsappVerificationToken,
        "phone",
        dto.whatsapp,
      );
      data.whatsapp = dto.whatsapp.replace(/\D/g, "");
    }

    if (dto.email !== undefined) {
      const trimmed = dto.email.trim();
      data.email = trimmed.length > 0 ? trimmed.toLowerCase() : null;
    }

    if (dto.description !== undefined) {
      const trimmed = dto.description.trim();
      data.description = trimmed.length > 0 ? trimmed : null;
    }

    if (Object.keys(data).length === 0) {
      return this.prisma.store.findUniqueOrThrow({ where: { id: storeId } });
    }

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data,
    });

    this.logger.log({
      msg: "store.updated",
      storeId,
      userId: user.id,
      fields: Object.keys(data),
    });

    return updated;
  }

  private assertCanManage(user: SafeUser): void {
    if (user.role !== "lojista" || !user.storeId) {
      throw new ForbiddenException({
        code: "STORE_ACCESS_DENIED",
        message: "Apenas o lojista pode gerenciar a loja.",
      });
    }
  }
}

/**
 * Calcula iniciais a partir do nome: 2 primeiras letras das 2 primeiras palavras.
 * "FlashCar Centro" → "FC"
 * "Auto" → "AU"
 */
function computeInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) {
    return words[0]!.slice(0, 2).toUpperCase();
  }
  return ((words[0]![0] ?? "") + (words[1]![0] ?? "")).toUpperCase();
}
