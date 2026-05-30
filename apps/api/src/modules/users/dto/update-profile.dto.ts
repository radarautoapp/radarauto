/**
 * UpdateProfileDto
 *
 * Campos editáveis no perfil:
 *  - name: opcional, ≥2 caracteres
 *  - phone: opcional, exige phoneVerificationToken pro mesmo número
 *
 * Email e CPF NÃO entram aqui (não editáveis no MVP).
 */
import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[\d\s()\-+]+$/, { message: "Telefone inválido" })
  @MinLength(10, { message: "Telefone deve ter pelo menos 10 dígitos" })
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(20, { message: "Token de verificação de telefone inválido" })
  phoneVerificationToken?: string;
}
