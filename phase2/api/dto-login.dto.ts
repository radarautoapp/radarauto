/**
 * LoginDto
 *
 * Email + senha. Multi-device permitido (sessões paralelas).
 */
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  deviceLabel?: string;
}
