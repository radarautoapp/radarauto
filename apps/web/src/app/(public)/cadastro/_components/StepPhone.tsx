/**
 * StepPhone — telefone com máscara e validação de comprimento mínimo.
 */
import { FormField, Input } from "@radar/ui";

export interface StepPhoneProps {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled: boolean;
  error: string | null;
}

export function StepPhone({
  value,
  onChange,
  onKeyDown,
  disabled,
  error,
}: StepPhoneProps): JSX.Element {
  return (
    <>
      <h1 className="wiz-title">Telefone WhatsApp</h1>
      <FormField
        label="WhatsApp"
        htmlFor="phone"
        hint={error ? undefined : "Com DDD. Ex.: (47) 99999-0000"}
        error={error}
      >
        <Input
          id="phone"
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder="(00) 00000-0000"
          inputMode="tel"
          autoComplete="tel"
          invalid={!!error}
          required
          autoFocus
        />
      </FormField>
    </>
  );
}
