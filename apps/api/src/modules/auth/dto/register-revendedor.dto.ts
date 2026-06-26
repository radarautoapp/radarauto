/**
 * RegisterRevendedorDto
 *
 * Exige verificação dupla (email + phone) + CPF válido.
 */
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterRevendedorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @Matches(/^[\d\s()\-+]+$/, { message: "Telefone inválido" })
  @MinLength(10, { message: "Telefone deve ter pelo menos 10 dígitos" })
  @MaxLength(20)
  phone!: string;

  @IsString()
  @Length(11, 14, { message: "CPF deve ter 11 dígitos" })
  @Matches(/^[\d.\-]+$/, { message: "CPF inválido" })
  cpf!: string;

  @IsString()
  @MinLength(8, { message: "A senha deve ter no mínimo 8 caracteres" })
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(20, { message: "Token de verificação de email inválido" })
  emailVerificationToken!: string;

  @IsOptional()
  @IsString()
  @MinLength(20, { message: "Token de verificação de telefone inválido" })
  phoneVerificationToken?: string;
}
