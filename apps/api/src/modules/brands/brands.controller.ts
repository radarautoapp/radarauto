/**
 * BrandsController
 *
 * GET /brands        — marcas COM logo (grid do wizard)
 * GET /brands?q=...   — busca em todas (alcança marcas raras sem logo)
 * Autenticado.
 */
import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import type { ListBrandsResponse } from "@radar/types";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { BrandsService } from "./brands.service";

@Controller("brands")
@UseGuards(JwtAuthGuard)
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  async list(@Query("q") q?: string): Promise<ListBrandsResponse> {
    const brands = q && q.trim() ? await this.brands.search(q) : await this.brands.listWithLogo();
    return { brands };
  }
}
