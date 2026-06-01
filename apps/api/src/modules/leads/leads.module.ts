/**
 * LeadsModule
 *
 * Engine de leads: tracking de comportamento (view, tempo, favorito, contato)
 * e qualificação COLD/WARM/HOT. A leitura pelos lojistas (tela de leads) entra
 * em fase posterior.
 */
import { Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma/prisma.module";
import { LeadsController } from "./leads.controller";
import { LeadsService } from "./leads.service";

@Module({
  imports: [PrismaModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
