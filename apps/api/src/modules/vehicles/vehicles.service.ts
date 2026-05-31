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
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

import { SafeUser } from "../auth/auth.service";

import { PrismaService } from "../../prisma/prisma.service";
import { IStorageService, STORAGE_SERVICE } from "../storage/storage.interface";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";

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

      const listing = await tx.listing.create({
        data: {
          vehicleId: vehicle.id,
          status: listingStatus,
          createdById: user.id,
          ...(isStaff ? { approvedById: user.id, approvedAt: now, publishedAt: now } : {}),
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

  /** Normaliza foto: 4:3, cover, otimizada em webp. */
  private async processPhoto(input: Buffer): Promise<Buffer> {
    return sharp(input)
      .rotate() // respeita EXIF
      .resize(PHOTO_WIDTH, PHOTO_HEIGHT, { fit: "cover", position: "centre" })
      .webp({ quality: 82 })
      .toBuffer();
  }
}
