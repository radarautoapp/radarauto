import { IsEmail, MaxLength } from "class-validator";

export class CheckEmailDto {
  @IsEmail({}, { message: "Email inválido" })
  @MaxLength(255)
  email!: string;
}
