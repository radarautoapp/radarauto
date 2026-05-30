/**
 * VerificationDTOs
 *
 * Validação de input dos endpoints de verificação.
 * Separa email e phone porque cada um tem regras diferentes.
 */
import { IsEmail, IsString, Length, Matches, MaxLength, MinLength } from "class-validator";

export class SendPhoneDto {
  @IsString()
  @Matches(/^[\d\s()\-+]+$/, { message: "Telefone inválido" })
  @MinLength(10, { message: "Telefone deve ter pelo menos 10 dígitos" })
  @MaxLength(20)
  phone!: string;
}

export class ConfirmPhoneDto {
  @IsString()
  @Matches(/^[\d\s()\-+]+$/, { message: "Telefone inválido" })
  @MinLength(10)
  @MaxLength(20)
  phone!: string;

  @IsString()
  @Length(6, 6, { message: "Código deve ter 6 dígitos" })
  @Matches(/^\d{6}$/, { message: "Código deve ser numérico" })
  code!: string;
}

export class SendEmailDto {
  @IsEmail({}, { message: "Email inválido" })
  @MaxLength(255)
  email!: string;
}

export class ConfirmEmailDto {
  @IsEmail({}, { message: "Email inválido" })
  @MaxLength(255)
  email!: string;

  @IsString()
  @Length(6, 6, { message: "Código deve ter 6 dígitos" })
  @Matches(/^\d{6}$/, { message: "Código deve ser numérico" })
  code!: string;
}
