/**
 * RecommendPriceDto
 */
import { IsArray, IsInt, IsString, Min } from "class-validator";

export class RecommendPriceDto {
  @IsInt()
  @Min(0)
  fipeCents!: number;

  @IsString()
  brand!: string;

  @IsString()
  model!: string;

  @IsString()
  category!: string;

  @IsInt()
  year!: number;

  @IsArray()
  @IsString({ each: true })
  optionals!: string[];
}
