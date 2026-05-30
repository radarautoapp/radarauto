/**
 * StepEmail — email com pré-check de duplicidade no goNext.
 */
import { FormField, Input } from "@radar/ui";

export interface StepEmailProps {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled: boolean;
  error: string | null;
}

export function StepEmail({
  value,
  onChange,
  onKeyDown,
  disabled,
  error,
}: StepEmailProps): JSX.Element {
  return (
    <>
      <h1 className="wiz-title">Qual seu melhor email?</h1>
      <FormField label="Email" htmlFor="email" error={error}>
        <Input
          id="email"
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder="seu@email.com"
          autoComplete="email"
          invalid={!!error}
          required
          autoFocus
        />
      </FormField>
    </>
  );
}
