/**
 * PrismaModule
 *
 * Disponibiliza o PrismaService globalmente.
 * Importado uma vez no AppModule.
 */
import { Global, Module } from "@nestjs/common";

import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
