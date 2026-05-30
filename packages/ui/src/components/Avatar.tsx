/**
 * Avatar
 *
 * Mostra imagem se imageUrl for fornecido; senão, iniciais com cor de fundo.
 *
 * Props:
 *  - initials: 1-3 chars maiúsculas
 *  - imageUrl: URL pública opcional (logo de loja, foto de user)
 *  - size: "sm" (32) | "md" (40) | "lg" (64) | "xl" (120) — default "md"
 *  - alt: alt text quando há imagem (default = initials)
 */
"use client";

import type { CSSProperties } from "react";

export interface AvatarProps {
  initials: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  alt?: string;
  className?: string;
  style?: CSSProperties;
}

const SIZE_MAP = {
  sm: 32,
  md: 40,
  lg: 64,
  xl: 120,
} as const;

export function Avatar({
  initials,
  imageUrl,
  size = "md",
  alt,
  className = "",
  style,
}: AvatarProps): JSX.Element {
  const px = SIZE_MAP[size];
  const fontSize = Math.round(px * 0.4);
  const finalStyle: CSSProperties = {
    width: px,
    height: px,
    fontSize,
    borderRadius: 16,
    overflow: "hidden",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--surface-2, #eef1f6)",
    color: "var(--text, #1f2937)",
    flexShrink: 0,
    ...style,
  };

  if (imageUrl) {
    return (
      <div
        className={`avatar avatar-${size}${className ? ` ${className}` : ""}`}
        style={finalStyle}
        aria-label={alt ?? initials}
      >
        <img
          src={imageUrl}
          alt={alt ?? initials}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "inherit",
            display: "block",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`avatar avatar-${size}${className ? ` ${className}` : ""}`}
      style={finalStyle}
      aria-label={alt ?? initials}
    >
      <span style={{ fontWeight: 600 }}>{initials}</span>
    </div>
  );
}
