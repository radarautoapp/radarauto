/**
 * Avatar
 *
 * Mini-iniciais com gradiente escuro (matching .av do protótipo).
 * Usado em Sidebar (footer), Topbar (user menu) e listagens.
 */
import type { CSSProperties } from "react";

export interface AvatarProps {
  initials: string;
  size?: number;
  rounded?: "md" | "full";
  className?: string;
  style?: CSSProperties;
}

export function Avatar({
  initials,
  size = 38,
  rounded = "md",
  className = "",
  style,
}: AvatarProps): JSX.Element {
  return (
    <div
      className={`av ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: rounded === "full" ? "50%" : 11,
        fontSize: Math.max(11, Math.round(size * 0.37)),
        ...style,
      }}
    >
      {initials.toUpperCase().slice(0, 2)}
    </div>
  );
}
