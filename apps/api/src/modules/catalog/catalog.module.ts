/**
 * CatalogModule — vitrine pública de veículos (descoberta).
 *
 * Separado do VehiclesModule (gestão da loja) porque é leitura pura de
 * todas as lojas. Importa PrismaModule para acesso ao banco.
 */
import { Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma/prisma.module";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";

@Module({
  imports: [PrismaModule],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
