import { forwardRef } from "react";
/**
 * Input + FormField
 *
 * Field wrapper com label, hint e mensagem de erro.
 * Input usa classe .inp do design system (matching protótipo).
 */
import type { InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className = "", ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`inp ${className}`}
      style={invalid ? { borderColor: "var(--danger)" } : undefined}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}

export function FormField({ label, htmlFor, hint, error, children }: FormFieldProps): JSX.Element {
  return (
    <div>
      <label className="lbl" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {(error || hint) && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: error ? "var(--danger)" : "var(--muted)",
            fontWeight: error ? 600 : 500,
          }}
        >
          {error || hint}
        </div>
      )}
    </div>
  );
}
