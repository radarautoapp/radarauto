/**
 * PricingController
 *
 * POST /pricing/recommend — calcula o Preço Recomendado RadarAuto.
 * Autenticado (usado no step de preço do wizard).
 */
import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import type { RecommendPriceResponse } from "@radar/types";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RecommendPriceDto } from "./dto/recommend-price.dto";
import { PricingService } from "./pricing.service";

@Controller("pricing")
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Post("recommend")
  async recommend(@Body() dto: RecommendPriceDto): Promise<RecommendPriceResponse> {
    return this.pricing.recommend({
      fipeCents: dto.fipeCents,
      brand: dto.brand,
      model: dto.model,
      category: dto.category,
      year: dto.year,
      optionals: dto.optionals,
    });
  }
}
