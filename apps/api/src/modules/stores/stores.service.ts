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
 *  - logo: upload + redimensionamento (sharp → 400x400 WebP)
 */
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Store } from "@prisma/client";
import sharp from "sharp";

import { PrismaService } from "../../prisma/prisma.service";
import { SafeUser } from "../auth/auth.service";
import { IStorageService, STORAGE_SERVICE } from "../storage/storage.interface";
import { VerificationService } from "../verification/verification.service";
import { UpdateStoreDto } from "./dto/update-store.dto";

const LOGO_ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];
const LOGO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB original — sharp comprime depois
const LOGO_MIN_DIMENSION = 200;
const LOGO_OUTPUT_DIMENSION = 400;

@Injectable()
export class StoresService {
  private readonly logger = new Logger(StoresService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verificationService: VerificationService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
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

    // SMS desabilitado: aceita novo telefone sem verificacao. TODO: reativar.
    if (dto.phone !== undefined) {
      if (dto.phoneVerificationToken) {
        await this.verificationService.consumeToken(dto.phoneVerificationToken, "phone", dto.phone);
      }
      data.phone = dto.phone.replace(/\D/g, "");
    }

    // SMS desabilitado: aceita novo whatsapp sem verificacao. TODO: reativar.
    if (dto.whatsapp !== undefined) {
      if (dto.whatsappVerificationToken) {
        await this.verificationService.consumeToken(
          dto.whatsappVerificationToken,
          "phone",
          dto.whatsapp,
        );
      }
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

  async uploadLogo(user: SafeUser, file: Express.Multer.File): Promise<Store> {
    this.assertCanManage(user);
    const storeId = user.storeId!;

    if (!file) {
      throw new BadRequestException({
        code: "LOGO_NO_FILE",
        message: "Nenhum arquivo enviado.",
      });
    }

    if (!LOGO_ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException({
        code: "LOGO_INVALID_TYPE",
        message: "Formato inválido. Use JPEG, PNG ou WebP.",
      });
    }

    if (file.size > LOGO_MAX_BYTES) {
      throw new BadRequestException({
        code: "LOGO_TOO_LARGE",
        message: `Arquivo muito grande. Máximo ${LOGO_MAX_BYTES / 1024 / 1024} MB.`,
      });
    }

    // Processa com sharp: valida dimensões, redimensiona, converte pra WebP
    let processed: Buffer;
    try {
      const meta = await sharp(file.buffer).metadata();
      if (
        !meta.width ||
        !meta.height ||
        meta.width < LOGO_MIN_DIMENSION ||
        meta.height < LOGO_MIN_DIMENSION
      ) {
        throw new BadRequestException({
          code: "LOGO_TOO_SMALL",
          message: `Imagem muito pequena. Mínimo ${LOGO_MIN_DIMENSION}×${LOGO_MIN_DIMENSION} pixels.`,
        });
      }
      processed = await sharp(file.buffer)
        .resize(LOGO_OUTPUT_DIMENSION, LOGO_OUTPUT_DIMENSION, {
          fit: "cover",
          position: "centre",
        })
        .webp({ quality: 85 })
        .toBuffer();
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.warn({ msg: "logo.sharp.failed", error: String(err) });
      throw new BadRequestException({
        code: "LOGO_PROCESSING_FAILED",
        message: "Não foi possível processar a imagem. Tente outra.",
      });
    }

    // Apaga logo antigo se houver
    const current = await this.prisma.store.findUniqueOrThrow({
      where: { id: storeId },
    });
    if (current.logoUrl) {
      const oldKey = this.storage.extractKey(current.logoUrl);
      if (oldKey) {
        await this.storage.delete(oldKey);
      }
    }

    // Sobe o novo
    const key = `logos/${storeId}-${Date.now()}.webp`;
    const result = await this.storage.upload({
      key,
      buffer: processed,
      contentType: "image/webp",
    });

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data: { logoUrl: result.url },
    });

    this.logger.log({
      msg: "store.logo.uploaded",
      storeId,
      userId: user.id,
      key,
      sizeKb: Math.round(processed.length / 1024),
    });

    return updated;
  }

  async removeLogo(user: SafeUser): Promise<Store> {
    this.assertCanManage(user);
    const storeId = user.storeId!;

    const current = await this.prisma.store.findUniqueOrThrow({
      where: { id: storeId },
    });

    if (current.logoUrl) {
      const key = this.storage.extractKey(current.logoUrl);
      if (key) {
        await this.storage.delete(key);
      }
    }

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data: { logoUrl: null },
    });

    this.logger.log({ msg: "store.logo.removed", storeId, userId: user.id });

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

function computeInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) {
    return words[0]!.slice(0, 2).toUpperCase();
  }
  return ((words[0]![0] ?? "") + (words[1]![0] ?? "")).toUpperCase();
}
