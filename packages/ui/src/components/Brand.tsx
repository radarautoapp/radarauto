/**
 * BrandMark / BrandLogo
 *
 * Logo do RadarAuto, reutilizável. Usa os SVGs oficiais (servidos de
 * /favicon.svg e /logo.svg pelo app web). Tem 2 variantes:
 *  - BrandMark: só o símbolo do radar (quadrado) — ideal para ícones e sidebar
 *  - BrandLogo: a marca horizontal completa (símbolo + "RadarAuto")
 */

export interface BrandMarkProps {
  size?: number;
}

export function BrandMark({ size = 40 }: BrandMarkProps): JSX.Element {
  return (
    <img
      src="/favicon.svg"
      alt="RadarAuto"
      width={size}
      height={size}
      style={{ display: "block", borderRadius: Math.round(size * 0.18) }}
    />
  );
}

export interface BrandLogoProps {
  size?: number;
  /** Altura da logo horizontal em px (a largura é proporcional). */
  height?: number;
}

export function BrandLogo({ size = 40, height }: BrandLogoProps): JSX.Element {
  // A logo horizontal tem proporção ~4.8:1 (1059x220). Usa `height` se dado,
  // senão deriva de `size` (mantém compat com chamadas existentes).
  const h = height ?? Math.round(size * 0.9);
  return (
    <img
      src="/logo.svg"
      alt="RadarAuto"
      height={h}
      style={{ display: "block", height: h, width: "auto" }}
    />
  );
}
