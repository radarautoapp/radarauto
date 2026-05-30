/**
 * UpdateStoreDto
 *
 * Campos editáveis da loja. Tudo opcional (partial update).
 * phone/whatsapp exigem token de verificação correspondente.
 */
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
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

  @IsOptional()
  @IsString()
  @Matches(/^[\d\s()\-+]+$/, { message: "WhatsApp inválido" })
  @MinLength(10, { message: "WhatsApp deve ter pelo menos 10 dígitos" })
  @MaxLength(20)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MinLength(20, { message: "Token de verificação de WhatsApp inválido" })
  whatsappVerificationToken?: string;

  @IsOptional()
  @IsEmail({}, { message: "Email inválido" })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Descrição deve ter no máximo 500 caracteres" })
  description?: string;
}
