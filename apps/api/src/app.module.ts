/**
 * App Module — Root module
 *
 * Composição raiz da API (Modular Monolith, Regra 23).
 */
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";

import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";
import { configSchema } from "./config/env.validation";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { CnpjModule } from "./modules/cnpj/cnpj.module";
import { HealthModule } from "./modules/health/health.module";
import { SessionsModule } from "./modules/sessions/sessions.module";
import { EmailModule } from "./modules/email/email.module";
import { StorageModule } from "./modules/storage/storage.module";
import { FipeModule } from "./modules/fipe/fipe.module";
import { BrandsModule } from "./modules/brands/brands.module";
import { PricingModule } from "./modules/pricing/pricing.module";
import { LocationsModule } from "./modules/locations/locations.module";
import { VehiclesModule } from "./modules/vehicles/vehicles.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { LeadsModule } from "./modules/leads/leads.module";
import { EmployeesModule } from "./modules/employees/employees.module";
import { StoresModule } from "./modules/stores/stores.module";
import { UsersModule } from "./modules/users/users.module";
import { VerificationModule } from "./modules/verification/verification.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    VehiclesModule,
    CatalogModule,
    LeadsModule,
    LocationsModule,
    PricingModule,
    BrandsModule,
    FipeModule,
    EmailModule,
    EmployeesModule,
    StorageModule,
    StoresModule,
    SessionsModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate: configSchema,
      envFilePath: [".env.local", ".env"],
    }),

    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

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
            "req.body.code",
            "req.body.verificationToken",
            "*.password",
            "*.passwordHash",
            "*.cpf",
            "*.code",
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
    CnpjModule,
    VerificationModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
  }
}
