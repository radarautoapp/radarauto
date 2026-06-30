/**
 * CatalogController
 *
 * GET /catalog     — vitrine pública de veículos (filtros/sort/paginação).
 * GET /catalog/:id — detalhe de um veículo (dados condicionados ao plano).
 *
 * Autenticado (qualquer role logado pode navegar o catálogo).
 */
import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";

import type { CatalogResponse, VehicleDetailResponse } from "@radar/types";

import { SafeUser } from "../auth/auth.service";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CatalogQueryDto } from "./dto/catalog-query.dto";
import { CatalogService } from "./catalog.service";

@UseGuards(JwtAuthGuard)
@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(@CurrentUser() user: SafeUser, @Query() query: CatalogQueryDto): Promise<CatalogResponse> {
    return this.catalog.list(user, query);
  }

  @Public()
  @Get(":id/preview")
  preview(@Param("id") id: string) {
    return this.catalog.preview(id);
  }

  @Get(":id")
  detail(@CurrentUser() user: SafeUser, @Param("id") id: string): Promise<VehicleDetailResponse> {
    return this.catalog.detail(user, id);
  }
}
