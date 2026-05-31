/**
 * CatalogController
 *
 * GET /catalog — vitrine pública de veículos (Listings ACTIVE de todas as
 * lojas). Aceita filtros, ordenação e paginação via query string.
 *
 * Autenticado (qualquer role logado pode navegar o catálogo).
 */
import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import type { CatalogResponse } from "@radar/types";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CatalogQueryDto } from "./dto/catalog-query.dto";
import { CatalogService } from "./catalog.service";

@UseGuards(JwtAuthGuard)
@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(@Query() query: CatalogQueryDto): Promise<CatalogResponse> {
    return this.catalog.list(query);
  }
}
