/**
 * StepCpf — CPF com máscara + validação local de dígito verificador.
 */
import { FormField, Input } from "@radar/ui";

export interface StepCpfProps {
  value: string;
  onChange: (v: string) => void;
  onValueChange: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled: boolean;
  error: string | null;
}

export function StepCpf({
  value,
  onChange,
  onValueChange,
  onKeyDown,
  disabled,
  error,
}: StepCpfProps): JSX.Element {
  return (
    <>
      <h1 className="wiz-title">Qual o seu CPF?</h1>
      <FormField
        label="CPF"
        htmlFor="cpf"
        error={error}
        hint={error ? undefined : "Apenas dígitos."}
      >
        <Input
          id="cpf"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onValueChange();
          }}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder="000.000.000-00"
          inputMode="numeric"
          autoComplete="off"
          invalid={!!error}
          required
          autoFocus
        />
      </FormField>
    </>
  );
}
