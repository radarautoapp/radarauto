import { IsString, IsNotEmpty } from "class-validator";

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
