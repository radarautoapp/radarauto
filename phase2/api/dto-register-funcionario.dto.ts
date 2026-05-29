/**
 * RegisterFuncionarioDto
 *
 * Cadastro de funcionário só por lojista autenticado (Regra 10).
 * Funcionário criado já vinculado à store do lojista que o cadastrou.
 */
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterFuncionarioDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
