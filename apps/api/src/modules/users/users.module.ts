/**
 * UsersModule
 *
 * Endpoints de gestão de perfil próprio.
 * Reusa VerificationService pra reverificar telefone.
 */
import { Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma/prisma.module";
import { VerificationModule } from "../verification/verification.module";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [PrismaModule, VerificationModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
