/**
 * BrandsController
 *
 * GET /brands — lista todas as marcas (com logoUrl quando houver).
 * Autenticado (usado no wizard de veículo).
 */
import { Controller, Get, UseGuards } from "@nestjs/common";

import type { ListBrandsResponse } from "@radar/types";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { BrandsService } from "./brands.service";

@Controller("brands")
@UseGuards(JwtAuthGuard)
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  async list(): Promise<ListBrandsResponse> {
    const brands = await this.brands.listAll();
    return { brands };
  }
}
