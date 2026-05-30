/**
 * FipeModule
 *
 * Consulta à Tabela FIPE com fallback de providers.
 * Ordem dos providers no array = ordem de tentativa (BrasilAPI → Parallelum).
 */
import { Module } from "@nestjs/common";

import { FipeController } from "./fipe.controller";
import { FIPE_PROVIDERS } from "./fipe.interface";
import { FipeService } from "./fipe.service";
import { BrasilApiFipeProvider } from "./providers/brasilapi.provider";
import { ParallelumFipeProvider } from "./providers/parallelum.provider";

@Module({
  controllers: [FipeController],
  providers: [
    BrasilApiFipeProvider,
    ParallelumFipeProvider,
    {
      provide: FIPE_PROVIDERS,
      inject: [BrasilApiFipeProvider, ParallelumFipeProvider],
      useFactory: (brasil: BrasilApiFipeProvider, parallelum: ParallelumFipeProvider) => [
        brasil,
        parallelum,
      ], // ordem = prioridade
    },
    FipeService,
  ],
  exports: [FipeService],
})
export class FipeModule {}
