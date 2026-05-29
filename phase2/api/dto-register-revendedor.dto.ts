/**
 * RegisterRevendedorDto
 *
 * Cadastro aberto: qualquer um pode criar conta de revendedor.
 */
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterRevendedorDto {
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
}
