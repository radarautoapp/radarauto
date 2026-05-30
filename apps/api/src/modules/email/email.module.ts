/**
 * EmailModule
 *
 * Factory por env: EMAIL_PROVIDER = mock | resend (default mock).
 * Em dev (NODE_ENV !== 'production'), exporta também o MockEmailProvider
 * concreto pra que controllers de debug possam inspecionar emails enviados.
 */
import { Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { EMAIL_SERVICE, IEmailService } from "./email.interface";
import { MockEmailProvider } from "./providers/mock.provider";
import { ResendEmailProvider } from "./providers/resend.provider";

@Module({
  imports: [ConfigModule],
  providers: [
    MockEmailProvider,
    ResendEmailProvider,
    {
      provide: EMAIL_SERVICE,
      inject: [ConfigService, MockEmailProvider, ResendEmailProvider],
      useFactory: (
        config: ConfigService,
        mock: MockEmailProvider,
        resend: ResendEmailProvider,
      ): IEmailService => {
        const provider = config.get<string>("EMAIL_PROVIDER") ?? "mock";
        const logger = new Logger("EmailModule");
        if (provider === "resend") {
          logger.log("Using ResendEmailProvider");
          return resend;
        }
        logger.log("Using MockEmailProvider (dev)");
        return mock;
      },
    },
  ],
  exports: [EMAIL_SERVICE, MockEmailProvider],
})
export class EmailModule {}
