/**
 * CatalogQueryDto — valida e transforma os query params do catálogo público.
 *
 * Query strings chegam como string; @Type/@Transform convertem para os tipos
 * corretos. Tudo é opcional. Preços em centavos.
 */
import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";

import type { CatalogSort } from "@radar/types";

const SORTS: CatalogSort[] = ["relevance", "price_asc", "price_desc", "recent"];

/** "true"/"1" → true; resto → false. Aceita boolean já convertido. */
function toBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  return value === "true" || value === "1";
}

/** CSV ou array → string[] limpo. */
function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const arr = Array.isArray(value) ? value : String(value).split(",");
  const cleaned = arr.map((s) => String(s).trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : undefined;
}

export class CatalogQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  fuel?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  kmMax?: number;

  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  delivery?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  opportunitiesOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  optionals?: string[];

  @IsOptional()
  @IsIn(SORTS)
  sort?: CatalogSort;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}
