/**
 * CnpjController
 *
 * GET /api/v1/cnpj/:cnpj — público, com throttle por IP.
 *
 * Throttle: 20 requisições por minuto por IP.
 * Em produção valeria a pena pôr em redis e ter throttle global.
 */
import { Controller, Get, Param } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { CnpjLookupResponse } from "@radar/types";

import { Public } from "../../common/decorators/public.decorator";
import { CnpjService } from "./cnpj.service";

@Controller("cnpj")
export class CnpjController {
  constructor(private readonly cnpjService: CnpjService) {}

  @Public()
  @Get(":cnpj")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async lookup(@Param("cnpj") cnpj: string): Promise<CnpjLookupResponse> {
    return this.cnpjService.lookup(cnpj);
  }
}
