/**
 * VehiclesModule
 *
 * Cadastro de veículos (Vehicle + Listing) via wizard.
 */
import { Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma/prisma.module";
import { StorageModule } from "../storage/storage.module";
import { VehiclesController } from "./vehicles.controller";
import { VehiclesService } from "./vehicles.service";

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
