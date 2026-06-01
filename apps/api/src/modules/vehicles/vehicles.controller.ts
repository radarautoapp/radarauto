/**
 * VehiclesController
 *
 * POST /vehicles — cria veículo (multipart/form-data):
 *   - campo "data": JSON com os dados do veículo (CreateVehicleDto)
 *   - campos "photos": até 8 arquivos de imagem
 *
 * Autenticado. Aprovação por role no service.
 */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { plainToInstance } from "class-transformer";
import { validateOrReject } from "class-validator";

import { SafeUser } from "../auth/auth.service";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { VehiclesService } from "./vehicles.service";

const MAX_PHOTOS = 8;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB por foto

interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller("vehicles")
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Get()
  async list(@CurrentUser() user: SafeUser) {
    const vehicles = await this.vehicles.list(user);
    return { vehicles };
  }

  @Get(":id")
  async findOne(@CurrentUser() user: SafeUser, @Param("id") id: string) {
    return this.vehicles.findOneForEdit(user, id);
  }

  @Post(":id/approve")
  async approve(@CurrentUser() user: SafeUser, @Param("id") id: string) {
    return this.vehicles.approve(user, id);
  }

  @Patch(":id/status")
  async setStatus(
    @CurrentUser() user: SafeUser,
    @Param("id") id: string,
    @Body("action") action: "pause" | "activate",
  ) {
    return this.vehicles.setStatus(user, id, action);
  }

  @Delete(":id")
  async remove(@CurrentUser() user: SafeUser, @Param("id") id: string) {
    return this.vehicles.remove(user, id);
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor("photos", MAX_PHOTOS, {
      limits: { fileSize: MAX_PHOTO_BYTES },
    }),
  )
  async create(
    @CurrentUser() user: SafeUser,
    @Body("data") rawData: string,
    @UploadedFiles() photos: MulterFile[],
  ) {
    if (!rawData) {
      throw new BadRequestException({
        code: "MISSING_DATA",
        message: "Dados do veículo ausentes.",
      });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawData);
    } catch {
      throw new BadRequestException({
        code: "INVALID_DATA",
        message: "Dados do veículo em formato inválido.",
      });
    }

    const dto = plainToInstance(CreateVehicleDto, parsed);
    try {
      await validateOrReject(dto, { whitelist: true });
    } catch (errors) {
      throw new BadRequestException({
        code: "VALIDATION_FAILED",
        message: "Há campos inválidos no cadastro.",
        details: errors,
      });
    }

    // valida tipos de imagem
    for (const f of photos ?? []) {
      if (!f.mimetype.startsWith("image/")) {
        throw new BadRequestException({
          code: "INVALID_PHOTO_TYPE",
          message: "Todos os arquivos devem ser imagens.",
        });
      }
    }

    return this.vehicles.create(user, dto, photos ?? []);
  }

  @Patch(":id")
  @UseInterceptors(
    FilesInterceptor("photos", MAX_PHOTOS, {
      limits: { fileSize: MAX_PHOTO_BYTES },
    }),
  )
  async update(
    @CurrentUser() user: SafeUser,
    @Param("id") id: string,
    @Body("data") rawData: string,
    @UploadedFiles() photos: MulterFile[],
  ) {
    if (!rawData) {
      throw new BadRequestException({
        code: "MISSING_DATA",
        message: "Dados do veículo ausentes.",
      });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawData);
    } catch {
      throw new BadRequestException({
        code: "INVALID_DATA",
        message: "Dados do veículo em formato inválido.",
      });
    }

    const dto = plainToInstance(UpdateVehicleDto, parsed);
    try {
      await validateOrReject(dto, { whitelist: true });
    } catch (errors) {
      throw new BadRequestException({
        code: "VALIDATION_FAILED",
        message: "Há campos inválidos na edição.",
        details: errors,
      });
    }

    return this.vehicles.update(user, id, dto, photos ?? []);
  }
}
