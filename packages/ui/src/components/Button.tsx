/**
 * Button
 *
 * Variantes do design system (matching .btn-* do protótipo):
 *   - primary: ação principal (azul com sombra)
 *   - secondary: ação secundária (branco com borda)
 *   - ghost: ação sutil (transparente)
 *   - danger: ação destrutiva (vermelho)
 *   - trending: oportunidade (laranja)
 *   - wa: WhatsApp (verde)
 *
 * Suporta loading e icon. Auto-disable durante loading.
 */
import type { ButtonHTMLAttributes, ComponentType, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "trending" | "wa";
type Size = "sm" | "md";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  icon?: ComponentType<{ size?: number }>;
  iconRight?: ComponentType<{ size?: number }>;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  disabled,
  icon: Icon,
  iconRight: IconR,
  children,
  className = "",
  type = "button",
  ...rest
}: ButtonProps): JSX.Element {
  const classes = [
    "btn",
    `btn-${variant}`,
    size === "sm" && "btn-sm",
    block && "btn-block",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <SpinnerIcon /> : Icon ? <Icon size={size === "sm" ? 14 : 16} /> : null}
      {children}
      {!loading && IconR ? <IconR size={size === "sm" ? 14 : 16} /> : null}
    </button>
  );
}

function SpinnerIcon(): JSX.Element {
  return (
    <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
