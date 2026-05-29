/**
 * App Module — Root module
 *
 * Propósito: composição raiz da API. Importa configs globais e módulos de feature.
 *
 * Arquitetura (Regra 23): Modular Monolith feature-based.
 * Cada módulo em src/modules/ é autocontido.
 *
 * Guards globais:
 *   - JwtAuthGuard: protege TODAS as rotas por padrão.
 *     Rotas públicas precisam @Public() explícito (Regra 10).
 */
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";

import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";
import { configSchema } from "./config/env.validation";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: configSchema,
      envFilePath: [".env.local", ".env"],
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: true,
        transport:
          process.env.NODE_ENV === "production"
            ? undefined
            : { target: "pino-pretty", options: { singleLine: true, colorize: true } },
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
            "*.passwordHash",
            "*.cpf",
          ],
          censor: "[REDACTED]",
        },
        customProps: (req) => ({
          correlationId: (req as { correlationId?: string }).correlationId,
        }),
      },
    }),

    PrismaModule,
    AuthModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
  }
}
