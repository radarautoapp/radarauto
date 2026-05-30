/**
 * Badge
 *
 * Pílula de status. 5 tons (matching .bdg do protótipo + Badge JSX).
 * Cores via CSS vars (não hardcoded).
 */
import type { ComponentType, ReactNode } from "react";

export type BadgeTone = "primary" | "success" | "warning" | "danger" | "trending" | "muted";

export interface BadgeProps {
  tone?: BadgeTone;
  icon?: ComponentType<{ size?: number }>;
  children: ReactNode;
}

export function Badge({ tone = "muted", icon: Icon, children }: BadgeProps): JSX.Element {
  return (
    <span className="bdg" style={{ background: `var(--${tone}-t)`, color: `var(--${tone})` }}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
