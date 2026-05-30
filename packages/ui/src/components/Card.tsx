/**
 * Card
 *
 * Container base do design system. Variantes via prop `padded`.
 * Compõe com qualquer conteúdo. Mantém classe .card do protótipo.
 */
import type { CSSProperties, ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  padded?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Card({ children, padded = true, className = "", style }: CardProps): JSX.Element {
  const cls = `card ${padded ? "card-p" : ""} ${className}`.trim();
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}
