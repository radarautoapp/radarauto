/**
 * RadarAuto API — Bootstrap
 *
 * Propósito: ponto de entrada da API NestJS.
 * Aplica configs globais: ValidationPipe (Regra 9), ExceptionFilter (Regra 28),
 * CORS, Logger estruturado (Regra 31), correlation ID.
 */
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";

import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  // Logger estruturado (Pino) — Regra 31
  app.useLogger(app.get(Logger));

  // Validação automática via DTOs — Regra 9
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Formato de erro padronizado — Regra 28
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS — origens permitidas vêm de env
  const corsOrigins = config.get<string>("CORS_ORIGINS", "http://localhost:3000").split(",");
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix("api/v1");

  const port = config.get<number>("API_PORT", 3001);
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`🚀 RadarAuto API rodando em http://localhost:${port}/api/v1`);
}

bootstrap().catch((err) => {
  console.error("Erro fatal ao iniciar API:", err);
  process.exit(1);
});
