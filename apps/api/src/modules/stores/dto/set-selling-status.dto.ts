import { IsBoolean } from "class-validator";

export class SetSellingStatusDto {
  @IsBoolean()
  approved!: boolean;
}
