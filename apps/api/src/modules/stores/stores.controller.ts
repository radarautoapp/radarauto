/**
 * StoresController
 *
 *   GET   /stores/me   - busca a loja do user autenticado (só lojista)
 *   PATCH /stores/me   - atualiza loja (só lojista, partial update)
 *
 * Service garante autorização (role + storeId match).
 */
import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { Store } from "@prisma/client";
import { Throttle } from "@nestjs/throttler";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { SafeUser } from "../auth/auth.service";
import { UpdateStoreDto } from "./dto/update-store.dto";
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
}
