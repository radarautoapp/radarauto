/**
 * VerificationModule
 *
 * Registra ambos os providers (sms + email) e o service genérico.
 * Reusa JwtModule pra emitir tokens.
 */
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import { MockEmailProvider } from "./providers/mock-email.provider";
import { MockSmsProvider } from "./providers/mock-sms.provider";
import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
      }),
    }),
  ],
  controllers: [VerificationController],
  providers: [VerificationService, MockSmsProvider, MockEmailProvider],
  exports: [VerificationService],
})
export class VerificationModule {}
