/**
 * VerificationModule
 *
 * Registra ambos os providers (sms + email) e o service genérico.
 * Reusa JwtModule pra emitir tokens.
 */
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import { EmailModule } from "../email/email.module";
import { EMAIL_VERIFICATION_SENDER } from "./providers/email-verification.token";
import { EmailVerificationSender } from "./providers/email-verification.sender";
import { MockEmailProvider } from "./providers/mock-email.provider";
import { MockSmsProvider } from "./providers/mock-sms.provider";
import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";

@Module({
  imports: [
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
      }),
    }),
  ],
  controllers: [VerificationController],
  providers: [
    VerificationService,
    MockSmsProvider,
    MockEmailProvider,
    EmailVerificationSender,
    {
      // Escolhe o provider de email da verificação conforme EMAIL_PROVIDER:
      // resend -> envia de verdade (template + Resend); senão -> mock (loga).
      provide: EMAIL_VERIFICATION_SENDER,
      inject: [ConfigService, MockEmailProvider, EmailVerificationSender],
      useFactory: (
        config: ConfigService,
        mock: MockEmailProvider,
        resend: EmailVerificationSender,
      ) => (config.get<string>("EMAIL_PROVIDER") === "resend" ? resend : mock),
    },
  ],
  exports: [VerificationService],
})
export class VerificationModule {}
