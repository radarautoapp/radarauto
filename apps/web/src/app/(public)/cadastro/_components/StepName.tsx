/**
 * StepName — nome completo (pelo menos 2 palavras).
 */
import { FormField, Input } from "@radar/ui";

export interface StepNameProps {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  hint?: string;
  disabled: boolean;
}

export function StepName({
  value,
  onChange,
  onKeyDown,
  hint,
  disabled,
}: StepNameProps): JSX.Element {
  return (
    <>
      <h1 className="wiz-title">Qual o seu nome?</h1>
      <FormField label="Nome completo" htmlFor="name" hint={hint}>
        <Input
          id="name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder="Nome e sobrenome"
          autoComplete="name"
          required
          autoFocus
        />
      </FormField>
    </>
  );
}
