/**
 * FipeController
 *
 * Rotas autenticadas (lojista/funcionário usam no wizard):
 *   GET /fipe/marcas
 *   GET /fipe/marcas/:brandCode/modelos
 *   GET /fipe/marcas/:brandCode/modelos/:modelCode/anos
 *   GET /fipe/marcas/:brandCode/modelos/:modelCode/anos/:yearCode/preco
 */
import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import type {
  GetFipePriceResponse,
  ListFipeBrandsResponse,
  ListFipeModelsResponse,
  ListFipeYearsResponse,
} from "@radar/types";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { FipeService } from "./fipe.service";

@Controller("fipe")
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class FipeController {
  constructor(private readonly fipe: FipeService) {}

  @Get("marcas")
  async brands(): Promise<ListFipeBrandsResponse> {
    const brands = await this.fipe.listBrands();
    return { brands };
  }

  @Get("marcas/:brandCode/modelos")
  async models(@Param("brandCode") brandCode: string): Promise<ListFipeModelsResponse> {
    const models = await this.fipe.listModels(brandCode);
    return { models };
  }

  @Get("marcas/:brandCode/modelos/:modelCode/anos")
  async years(
    @Param("brandCode") brandCode: string,
    @Param("modelCode") modelCode: string,
  ): Promise<ListFipeYearsResponse> {
    const years = await this.fipe.listYears(brandCode, modelCode);
    return { years };
  }

  @Get("marcas/:brandCode/modelos/:modelCode/anos/:yearCode/preco")
  async price(
    @Param("brandCode") brandCode: string,
    @Param("modelCode") modelCode: string,
    @Param("yearCode") yearCode: string,
  ): Promise<GetFipePriceResponse> {
    const price = await this.fipe.getPrice(brandCode, modelCode, yearCode);
    return { price };
  }
}
