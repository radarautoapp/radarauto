/**
 * App Module — Root module
 *
 * Propósito: composição raiz da API. Importa configs globais e módulos de feature.
 *
 * Arquitetura (Regra 23): Modular Monolith feature-based.
 * Cada módulo em src/modules/ é autocontido (controller, service, dto, etc).
 */
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";

import { configSchema } from "./config/env.validation";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    // Config + validação de env (Regra 30)
    ConfigModule.forRoot({
      isGlobal: true,
      validate: configSchema,
      envFilePath: [".env.local", ".env"],
    }),

    // Logger estruturado com correlation ID (Regras 28, 31)
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: true,
        transport:
          process.env.NODE_ENV === "production"
            ? undefined
            : { target: "pino-pretty", options: { singleLine: true, colorize: true } },
        // Sanitiza PII de logs (Regra 29)
        redact: {
          paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "req.body.password",
            "req.body.passwordConfirm",
            "req.body.cpf",
            "req.body.email",
            "req.body.phone",
            "*.password",
            "*.cpf",
          ],
          censor: "[REDACTED]",
        },
        customProps: (req) => ({
          correlationId: (req as { correlationId?: string }).correlationId,
        }),
      },
    }),

    // Feature modules
    HealthModule,
  ],
  providers: [CorrelationIdMiddleware],
})
export class AppModule {}
