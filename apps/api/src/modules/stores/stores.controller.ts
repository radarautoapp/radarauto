/**
 * StoresController
 *
 *   GET    /stores/me        - busca a loja do user autenticado (só lojista)
 *   PATCH  /stores/me        - atualiza loja (só lojista, partial update)
 *   POST   /stores/me/logo   - upload de logo (multipart, só lojista)
 *   DELETE /stores/me/logo   - remove logo (só lojista)
 *
 * Service garante autorização (role + storeId match).
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Store } from "@prisma/client";
import { Throttle } from "@nestjs/throttler";

import { UserRole } from "@prisma/client";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RoleGuard } from "../../common/guards/role.guard";
import { SafeUser } from "../auth/auth.service";
import { UpdateStoreDto } from "./dto/update-store.dto";
import { SetSellingStatusDto } from "./dto/set-selling-status.dto";
import { StoresService } from "./stores.service";

@Controller("stores")
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Get("me")
  async getMine(@CurrentUser() user: SafeUser): Promise<{ store: Store }> {
    const store = await this.stores.getMine(user);
    return { store };
  }

  @Patch("me")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async updateMine(
    @CurrentUser() user: SafeUser,
    @Body() dto: UpdateStoreDto,
  ): Promise<{ store: Store }> {
    const store = await this.stores.updateMine(user, dto);
    return { store };
  }

  @Post("me/logo")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB (sharp comprime depois)
    }),
  )
  async uploadLogo(
    @CurrentUser() user: SafeUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ store: Store }> {
    const store = await this.stores.uploadLogo(user, file);
    return { store };
  }

  @Delete("me/logo")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async removeLogo(@CurrentUser() user: SafeUser): Promise<{ store: Store }> {
    const store = await this.stores.removeLogo(user);
    return { store };
  }

  /* -------------------------- ADMIN -------------------------- */

  @Get("admin/overview")
  @UseGuards(RoleGuard)
  @Roles(UserRole.admin)
  async getAdminOverview() {
    return this.stores.getAdminOverviewFull();
  }

  @Get("admin/all")
  @UseGuards(RoleGuard)
  @Roles(UserRole.admin)
  async listAllForAdmin() {
    const stores = await this.stores.listAllForAdmin();
    return { stores };
  }

  @Patch("admin/:id/selling-status")
  @UseGuards(RoleGuard)
  @Roles(UserRole.admin)
  async setSellingStatus(
    @Param("id") id: string,
    @Body() dto: SetSellingStatusDto,
  ): Promise<{ store: Store }> {
    const store = await this.stores.setSellingStatus(id, dto.approved);
    return { store };
  }
}
