/**
 * CnpjModule
 *
 * Wiring do feature de consulta de CNPJ.
 * Exporta o service pra ser usado em outros módulos (ex: AuthService.registerLojista).
 */
import { Module } from "@nestjs/common";

import { CnpjController } from "./cnpj.controller";
import { CnpjService } from "./cnpj.service";
import { BrasilApiProvider } from "./providers/brasilapi.provider";
import { ReceitaWsProvider } from "./providers/receitaws.provider";

@Module({
  controllers: [CnpjController],
  providers: [CnpjService, BrasilApiProvider, ReceitaWsProvider],
  exports: [CnpjService],
})
export class CnpjModule {}
