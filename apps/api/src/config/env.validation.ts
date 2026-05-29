/**
 * Env validation — Regra 30
 *
 * Propósito: valida variáveis de ambiente no boot. Falha cedo se faltar/inválido.
 * Usa class-validator pra garantir tipos e presença.
 */
import { plainToInstance } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, MinLength, validateSync } from "class-validator";

enum Environment {
  Development = "development",
  Staging = "staging",
  Production = "production",
  Test = "test",
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV!: Environment;

  @IsNumber()
  @IsOptional()
  API_PORT: number = 3001;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32, { message: "JWT_SECRET deve ter no mínimo 32 caracteres" })
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = "7d";

  @IsString()
  @IsOptional()
  CORS_ORIGINS: string = "http://localhost:3000";
}

export function configSchema(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(
      `Env validation failed:\n${errors
        .map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(", ")}`)
        .join("\n")}`,
    );
  }
  return validated;
}
