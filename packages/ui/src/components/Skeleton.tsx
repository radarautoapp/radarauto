/**
 * Skeleton
 *
 * Placeholder retangular animado pra estados de carregamento.
 * Substitui spinners (melhor UX porque sugere a forma final do conteúdo).
 *
 * Props:
 *   - width?: string (default "100%")
 *   - height?: string (default 16px)
 *   - circle?: boolean (renderiza círculo perfeito)
 *   - className?: string (espaços extras)
 */
"use client";

export interface SkeletonProps {
  width?: string;
  height?: string;
  circle?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  width = "100%",
  height = "16px",
  circle = false,
  className = "",
  style,
}: SkeletonProps): JSX.Element {
  const computedStyle: React.CSSProperties = {
    width,
    height: circle ? width : height,
    borderRadius: circle ? "50%" : 8,
    ...style,
  };
  return <div className={`sk ${className}`} style={computedStyle} aria-hidden="true" />;
}

/**
 * Conveniência: linha de texto (font size variável).
 */
export function SkeletonText({
  lines = 1,
  width = "100%",
  lastWidth,
}: {
  lines?: number;
  width?: string;
  lastWidth?: string;
}): JSX.Element {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 && lastWidth ? lastWidth : width} height="14px" />
      ))}
    </div>
  );
}
