/**
 * ChangePasswordDto
 *
 * Mudança de senha exige validação da senha atual.
 * Após troca, todas as OUTRAS sessões (exceto a atual) são revogadas.
 */
import { IsString, MaxLength, MinLength } from "class-validator";

export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: "Senha atual obrigatória" })
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: "A nova senha deve ter no mínimo 8 caracteres" })
  @MaxLength(128)
  newPassword!: string;
}
