/**
 * CreateVehicleDto
 *
 * Dados do veículo enviados pelo wizard (multipart: este JSON + arquivos de foto).
 * Os campos numéricos chegam como string no multipart → DTO converte com @Type.
 * Preço e FIPE em CENTAVOS.
 */
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from "class-validator";

export class CreateVehicleDto {
  @IsString()
  @MinLength(1)
  brand!: string;

  @IsString()
  @MinLength(1)
  model!: string;

  @IsString()
  version!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1900)
  year!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1900)
  yearModel!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  km!: number;

  @IsString()
  fuel!: string;

  @IsString()
  transm!: string;

  @IsString()
  color!: string;

  @IsString()
  colorHex!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]$/, { message: "O final da placa deve ser um único dígito (0-9)." })
  plate?: string;

  @IsString()
  category!: string;

  /** Preço de venda em CENTAVOS */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  price!: number;

  /** FIPE em CENTAVOS */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fipe!: number;

  @IsString()
  @MinLength(1)
  city!: string;

  @IsString()
  @MinLength(1)
  state!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optionals?: string[];

  @IsOptional()
  @IsString()
  obs?: string;

  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  delivery?: boolean;
}
