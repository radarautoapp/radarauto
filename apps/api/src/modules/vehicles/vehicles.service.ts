/**
 * VehiclesService
 *
 * Cria veículos (Vehicle + Listing) a partir do wizard.
 *
 * Regras:
 *  - Usuário precisa ter storeId (revendedor sem loja não cadastra).
 *  - Fotos: upload pro bucket "vehicles" (Supabase), normalizadas com sharp
 *    (canvas 4:3, otimizadas em webp).
 *  - Aprovação por role (Regra 3.4):
 *      funcionario → Listing PENDING (aguarda lojista aprovar)
 *      lojista/admin → Listing ACTIVE direto
 *  - Vehicle + Listing criados em transação.
 *  - Preço e FIPE em centavos.
 */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

import { SafeUser } from "../auth/auth.service";

import { computeRankingScore } from "../../common/ranking";
import { listingExpiresAt } from "../../common/listing-ttl";

import { PrismaService } from "../../prisma/prisma.service";
import { IStorageService, STORAGE_SERVICE } from "../storage/storage.interface";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";

const VEHICLES_BUCKET = "vehicles";
const MAX_PHOTOS = 8;
const PHOTO_WIDTH = 1280;
const PHOTO_HEIGHT = 960; // 4:3

interface UploadedPhoto {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  async create(user: SafeUser, dto: CreateVehicleDto, photos: UploadedPhoto[]) {
    if (!user.storeId) {
      throw new ForbiddenException({
        code: "NO_STORE",
        message: "Você precisa ter uma loja para cadastrar veículos.",
      });
    }

    if (!photos || photos.length === 0) {
      throw new BadRequestException({
        code: "PHOTOS_REQUIRED",
        message: "Adicione pelo menos uma foto do veículo.",
      });
    }
    if (photos.length > MAX_PHOTOS) {
      throw new BadRequestException({
        code: "TOO_MANY_PHOTOS",
        message: `Máximo de ${MAX_PHOTOS} fotos por veículo.`,
      });
    }

    // 1. Processa + sobe as fotos (na ordem recebida)
    const vehicleId = randomUUID();
    const photoUrls: string[] = [];

    for (let i = 0; i < photos.length; i++) {
      const processed = await this.processPhoto(photos[i]!.buffer);
      const key = `${user.storeId}/${vehicleId}/${i}-${Date.now()}.webp`;
      const { url } = await this.storage.upload({
        key,
        buffer: processed,
        contentType: "image/webp",
        bucket: VEHICLES_BUCKET,
      });
      photoUrls.push(url);
    }

    // 2. Status do listing por role
    const isStaff = user.role === "lojista" || user.role === "admin";
    const listingStatus = isStaff ? "ACTIVE" : "PENDING";
    const now = new Date();

    // 3. Cria Vehicle + Listing em transação
    const result = await this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.create({
        data: {
          id: vehicleId,
          brand: dto.brand,
          model: dto.model,
          version: dto.version,
          year: dto.year,
          yearModel: dto.yearModel,
          km: dto.km,
          fuel: dto.fuel,
          transm: dto.transm,
          color: dto.color,
          colorHex: dto.colorHex,
          plate: dto.plate ?? null,
          category: dto.category,
          price: dto.price,
          fipe: dto.fipe,
          city: dto.city,
          state: dto.state,
          optionals: dto.optionals ?? [],
          obs: dto.obs ?? null,
          photos: photoUrls,
          delivery: dto.delivery ?? false,
          storeId: user.storeId!,
        },
      });

      const rankingScore = computeRankingScore({
        price: vehicle.price,
        fipe: vehicle.fipe,
        views: 0,
        favorites: 0,
        photoCount: vehicle.photos.length,
        hasObs: !!vehicle.obs,
        year: vehicle.year,
        km: vehicle.km,
        publishedAt: isStaff ? now : null,
        now,
      });

      const listing = await tx.listing.create({
        data: {
          vehicleId: vehicle.id,
          status: listingStatus,
          rankingScore,
          createdById: user.id,
          ...(isStaff
            ? {
                approvedById: user.id,
                approvedAt: now,
                publishedAt: now,
                expiresAt: listingExpiresAt(now),
              }
            : {}),
        },
      });

      return { vehicle, listing };
    });

    this.logger.log({
      msg: "vehicle.created",
      vehicleId: result.vehicle.id,
      status: listingStatus,
      photos: photoUrls.length,
      by: user.id,
    });

    return {
      id: result.vehicle.id,
      status: result.listing.status,
      photos: photoUrls,
    };
  }

  /**
   * Lista os veículos da loja do usuário (lojista e funcionário veem todos
   * os da mesma loja). Inclui status do listing e foto de capa.
   */
  async list(user: SafeUser) {
    if (!user.storeId) {
      throw new ForbiddenException({
        code: "NO_STORE",
        message: "Você não tem uma loja associada.",
      });
    }

    const vehicles = await this.prisma.vehicle.findMany({
      where: { storeId: user.storeId, deletedAt: null },
      include: {
        listing: {
          select: {
            status: true,
            views: true,
            favorites: true,
            expiresAt: true,
            createdBy: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return vehicles.map((v) => {
      const status = v.listing?.status ?? "DRAFT";
      return {
        id: v.id,
        brand: v.brand,
        model: v.model,
        version: v.version,
        year: v.year,
        yearModel: v.yearModel,
        km: v.km,
        color: v.color,
        price: v.price,
        fipe: v.fipe,
        city: v.city,
        state: v.state,
        coverPhoto: v.photos[0] ?? null,
        photoCount: v.photos.length,
        delivery: v.delivery,
        status,
        views: v.listing?.views ?? 0,
        favorites: v.listing?.favorites ?? 0,
        createdByName: v.listing?.createdBy?.name ?? "—",
        pendingApproval: status === "PENDING",
        createdAt: v.createdAt.toISOString(),
        expiresAt: v.listing?.expiresAt ? v.listing.expiresAt.toISOString() : null,
      };
    });
  }

  /**
   * Aprova um veículo PENDING → ACTIVE. Só o lojista (dono) da loja pode.
   */
  async approve(user: SafeUser, vehicleId: string) {
    if (user.role !== "lojista" && user.role !== "admin") {
      throw new ForbiddenException({
        code: "NOT_ALLOWED",
        message: "Apenas o lojista pode aprovar veículos.",
      });
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, deletedAt: null },
      include: { listing: true },
    });

    if (!vehicle || !vehicle.listing) {
      throw new NotFoundException({
        code: "VEHICLE_NOT_FOUND",
        message: "Veículo não encontrado.",
      });
    }

    if (vehicle.storeId !== user.storeId) {
      throw new ForbiddenException({
        code: "NOT_YOUR_STORE",
        message: "Esse veículo não é da sua loja.",
      });
    }

    if (vehicle.listing.status !== "PENDING") {
      throw new ForbiddenException({
        code: "NOT_PENDING",
        message: "Esse veículo não está aguardando aprovação.",
      });
    }

    const now = new Date();
    const publishedAt = vehicle.listing.publishedAt ?? now;
    const rankingScore = computeRankingScore({
      price: vehicle.price,
      fipe: vehicle.fipe,
      views: vehicle.listing.views,
      favorites: vehicle.listing.favorites,
      photoCount: vehicle.photos.length,
      hasObs: !!vehicle.obs,
      year: vehicle.year,
      km: vehicle.km,
      publishedAt,
      now,
    });
    const updated = await this.prisma.listing.update({
      where: { id: vehicle.listing.id },
      data: {
        status: "ACTIVE",
        approvedById: user.id,
        approvedAt: now,
        publishedAt,
        expiresAt: listingExpiresAt(now),
        rankingScore,
      },
      select: { status: true },
    });

    this.logger.log({
      msg: "vehicle.approved",
      vehicleId,
      by: user.id,
    });

    return { id: vehicleId, status: updated.status };
  }

  /**
   * Carrega um veículo da loja para edição (valida dono). Retorna todos os
   * campos + as URLs das fotos atuais.
   */
  async findOneForEdit(user: SafeUser, vehicleId: string) {
    const v = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, deletedAt: null },
      include: { listing: { select: { status: true } } },
    });

    if (!v) {
      throw new NotFoundException({
        code: "VEHICLE_NOT_FOUND",
        message: "Veículo não encontrado.",
      });
    }
    if (v.storeId !== user.storeId) {
      throw new ForbiddenException({
        code: "NOT_ALLOWED",
        message: "Você não tem permissão para editar este veículo.",
      });
    }

    return {
      id: v.id,
      brand: v.brand,
      model: v.model,
      version: v.version,
      year: v.year,
      yearModel: v.yearModel,
      km: v.km,
      fuel: v.fuel,
      transm: v.transm,
      color: v.color,
      colorHex: v.colorHex,
      plate: v.plate,
      category: v.category,
      price: v.price,
      fipe: v.fipe,
      city: v.city,
      state: v.state,
      optionals: v.optionals,
      obs: v.obs,
      delivery: v.delivery,
      photos: v.photos,
      status: v.listing?.status ?? "DRAFT",
    };
  }

  /**
   * Atualiza um veículo da loja (valida dono). As fotos seguem `photoOrder`:
   * cada item é uma URL existente (manter) ou "new:N" (arquivo novo na posição
   * N de `newPhotos`). Sobe as novas, remonta o array final e recalcula o score.
   */
  async update(
    user: SafeUser,
    vehicleId: string,
    dto: UpdateVehicleDto,
    newPhotos: UploadedPhoto[],
  ) {
    const existing = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, deletedAt: null },
      include: { listing: true },
    });

    if (!existing) {
      throw new NotFoundException({
        code: "VEHICLE_NOT_FOUND",
        message: "Veículo não encontrado.",
      });
    }
    if (existing.storeId !== user.storeId) {
      throw new ForbiddenException({
        code: "NOT_ALLOWED",
        message: "Você não tem permissão para editar este veículo.",
      });
    }

    // Monta o array final de fotos a partir do photoOrder.
    const currentUrls = new Set(existing.photos);
    const finalPhotos: string[] = [];
    // Sobe as fotos novas sob demanda (cache por índice N).
    const uploadedNew = new Map<number, string>();

    for (const item of dto.photoOrder) {
      if (item.startsWith("new:")) {
        const idx = Number(item.slice(4));
        if (!Number.isInteger(idx) || idx < 0 || idx >= newPhotos.length) {
          throw new BadRequestException({
            code: "INVALID_PHOTO_REF",
            message: "Referência de foto nova inválida.",
          });
        }
        let url = uploadedNew.get(idx);
        if (!url) {
          const processed = await this.processPhoto(newPhotos[idx]!.buffer);
          const key = `${existing.storeId}/${existing.id}/${idx}-${Date.now()}.webp`;
          const res = await this.storage.upload({
            key,
            buffer: processed,
            contentType: "image/webp",
            bucket: VEHICLES_BUCKET,
          });
          url = res.url;
          uploadedNew.set(idx, url);
        }
        finalPhotos.push(url);
      } else {
        // URL existente: só aceita se realmente pertencia ao veículo.
        if (!currentUrls.has(item)) {
          throw new BadRequestException({
            code: "INVALID_PHOTO_REF",
            message: "Referência de foto inválida.",
          });
        }
        finalPhotos.push(item);
      }
    }

    if (finalPhotos.length === 0) {
      throw new BadRequestException({
        code: "PHOTOS_REQUIRED",
        message: "Adicione pelo menos uma foto do veículo.",
      });
    }
    if (finalPhotos.length > MAX_PHOTOS) {
      throw new BadRequestException({
        code: "TOO_MANY_PHOTOS",
        message: `Máximo de ${MAX_PHOTOS} fotos por veículo.`,
      });
    }

    const now = new Date();
    const updated = await this.prisma.vehicle.update({
      where: { id: existing.id },
      data: {
        brand: dto.brand,
        model: dto.model,
        version: dto.version,
        year: dto.year,
        yearModel: dto.yearModel,
        km: dto.km,
        fuel: dto.fuel,
        transm: dto.transm,
        color: dto.color,
        colorHex: dto.colorHex,
        plate: dto.plate ?? null,
        category: dto.category,
        price: dto.price,
        fipe: dto.fipe,
        city: dto.city,
        state: dto.state,
        optionals: dto.optionals ?? [],
        obs: dto.obs ?? null,
        photos: finalPhotos,
        delivery: dto.delivery ?? false,
      },
    });

    // Recalcula o Radar Score com os dados novos.
    if (existing.listing) {
      const rankingScore = computeRankingScore({
        price: updated.price,
        fipe: updated.fipe,
        views: existing.listing.views,
        favorites: existing.listing.favorites,
        photoCount: updated.photos.length,
        hasObs: !!updated.obs,
        year: updated.year,
        km: updated.km,
        publishedAt: existing.listing.publishedAt,
        now,
      });
      await this.prisma.listing.update({
        where: { id: existing.listing.id },
        data: { rankingScore },
      });
    }

    this.logger.log({ msg: "vehicle.updated", vehicleId, by: user.id });
    return { id: updated.id, photos: finalPhotos };
  }

  /**
   * Pausa ou reativa um anúncio (ACTIVE ↔ INACTIVE). Só o dono da loja.
   * Não permite pausar anúncios PENDING/SOLD/BLOCKED.
   */
  async setStatus(
    user: SafeUser,
    vehicleId: string,
    action: "pause" | "activate" | "sell" | "unsell",
  ) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, deletedAt: null },
      include: { listing: true },
    });

    if (!vehicle || !vehicle.listing) {
      throw new NotFoundException({
        code: "VEHICLE_NOT_FOUND",
        message: "Veículo não encontrado.",
      });
    }

    if (vehicle.storeId !== user.storeId) {
      throw new ForbiddenException({
        code: "NOT_ALLOWED",
        message: "Você não tem permissão para alterar este veículo.",
      });
    }

    const current = vehicle.listing.status;

    // Regras de transição por ação.
    if (action === "pause" && current !== "ACTIVE") {
      throw new ConflictException({
        code: "INVALID_STATUS",
        message: "Apenas anúncios ativos podem ser pausados.",
      });
    }
    if (action === "activate" && current !== "INACTIVE") {
      throw new ConflictException({
        code: "INVALID_STATUS",
        message: "Apenas anúncios pausados podem ser reativados.",
      });
    }
    if (action === "sell" && current !== "ACTIVE" && current !== "INACTIVE") {
      throw new ConflictException({
        code: "INVALID_STATUS",
        message: "Apenas anúncios ativos ou pausados podem ser marcados como vendidos.",
      });
    }
    if (action === "unsell" && current !== "SOLD") {
      throw new ConflictException({
        code: "INVALID_STATUS",
        message: "Apenas anúncios vendidos podem ser revertidos.",
      });
    }

    const now = new Date();
    const transitions = {
      pause: { status: "INACTIVE", soldAt: null },
      activate: { status: "ACTIVE", soldAt: null },
      sell: { status: "SOLD", soldAt: now },
      unsell: { status: "ACTIVE", soldAt: null },
    } as const;
    const next = transitions[action];

    // Ativar/reativar renova a janela de 24h; publishedAt também atualiza para
    // o feed considerar o anúncio "fresco" de novo.
    const becomesActive = next.status === "ACTIVE";

    const updated = await this.prisma.listing.update({
      where: { id: vehicle.listing.id },
      data: {
        status: next.status,
        soldAt: next.soldAt,
        ...(becomesActive ? { expiresAt: listingExpiresAt(now), publishedAt: now } : {}),
      },
      select: { status: true },
    });

    this.logger.log({ msg: "vehicle.status_changed", vehicleId, action, by: user.id });
    return { status: updated.status };
  }

  /**
   * Exclui um anúncio (soft delete via deletedAt). Só o dono da loja.
   * Marca o Vehicle e o Listing como deletados.
   */
  async remove(user: SafeUser, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, deletedAt: null },
      include: { listing: true },
    });

    if (!vehicle) {
      throw new NotFoundException({
        code: "VEHICLE_NOT_FOUND",
        message: "Veículo não encontrado.",
      });
    }

    if (vehicle.storeId !== user.storeId) {
      throw new ForbiddenException({
        code: "NOT_ALLOWED",
        message: "Você não tem permissão para excluir este veículo.",
      });
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      if (vehicle.listing) {
        await tx.listing.update({
          where: { id: vehicle.listing.id },
          data: { deletedAt: now },
        });
      }
      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { deletedAt: now },
      });
    });

    this.logger.log({ msg: "vehicle.removed", vehicleId, by: user.id });
    return { deleted: true };
  }

  /** Normaliza foto: 4:3, cover, otimizada em webp. */
  private async processPhoto(input: Buffer): Promise<Buffer> {
    return sharp(input)
      .rotate() // respeita EXIF
      .resize(PHOTO_WIDTH, PHOTO_HEIGHT, { fit: "cover", position: "centre" })
      .webp({ quality: 82 })
      .toBuffer();
  }
}
