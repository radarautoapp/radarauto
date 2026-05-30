/**
 * StepPassword — senha + confirmação com validação de igualdade.
 */
import { FormField, PasswordInput } from "@radar/ui";

export interface StepPasswordProps {
  password: string;
  passwordConfirm: string;
  onPasswordChange: (v: string) => void;
  onPasswordConfirmChange: (v: string) => void;
  onPasswordConfirmBlur: () => void;
  pwConfirmError: string | null;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

export function StepPassword({
  password,
  passwordConfirm,
  onPasswordChange,
  onPasswordConfirmChange,
  onPasswordConfirmBlur,
  pwConfirmError,
  onKeyDown,
  disabled,
}: StepPasswordProps): JSX.Element {
  return (
    <>
      <h1 className="wiz-title">Defina uma senha</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FormField label="Senha" htmlFor="password" hint="Mínimo 8 caracteres.">
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            disabled={disabled}
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={8}
            required
            autoFocus
          />
        </FormField>
        <FormField label="Confirmar senha" htmlFor="passwordConfirm" error={pwConfirmError}>
          <PasswordInput
            id="passwordConfirm"
            value={passwordConfirm}
            onChange={(e) => onPasswordConfirmChange(e.target.value)}
            onBlur={onPasswordConfirmBlur}
            onKeyDown={onKeyDown}
            disabled={disabled}
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={8}
            invalid={!!pwConfirmError}
            required
          />
        </FormField>
      </div>
    </>
  );
}
