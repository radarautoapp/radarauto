/**
 * RegisterLojistaDto
 *
 * Cadastro aberto de lojista. Cria User + Store atrelados na mesma transação.
 */
import { IsEmail, IsString, Length, MaxLength, MinLength } from "class-validator";

export class RegisterLojistaDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8, { message: "A senha deve ter no mínimo 8 caracteres" })
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  storeName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  storePhone!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  storeCity!: string;

  @IsString()
  @Length(2, 2, { message: "UF deve ter 2 caracteres" })
  storeState!: string;
}
