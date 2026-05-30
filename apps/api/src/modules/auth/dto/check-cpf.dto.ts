import { IsString, Length, Matches } from "class-validator";

export class CheckCpfDto {
  @IsString()
  @Length(11, 14, { message: "CPF deve ter 11 dígitos" })
  @Matches(/^[\d.\-]+$/, { message: "CPF inválido" })
  cpf!: string;
}
