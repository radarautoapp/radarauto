/**
 * StoresModule
 *
 * Endpoints de gestão da própria loja (lojista).
 * Reusa VerificationService pra OTP de phone/whatsapp.
 */
import { Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma/prisma.module";
import { VerificationModule } from "../verification/verification.module";
import { StoresController } from "./stores.controller";
import { StoresService } from "./stores.service";

@Module({
  imports: [PrismaModule, VerificationModule],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
