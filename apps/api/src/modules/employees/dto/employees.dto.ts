import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class InviteEmployeeDto {
  @IsEmail({}, { message: "Email inválido" })
  @MaxLength(255)
  email!: string;
}

export class AcceptInviteDto {
  @IsString()
  @MinLength(2, { message: "Nome muito curto" })
  @MaxLength(80)
  name!: string;

  @IsString()
  @MinLength(8, { message: "Senha deve ter pelo menos 8 caracteres" })
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
