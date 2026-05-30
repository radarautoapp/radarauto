/**
 * BrandMark / BrandName
 *
 * Logo do RadarAuto, reutilizável. Tem 2 variantes:
 *  - BrandMark: só o quadradinho com o raio (Zap)
 *  - BrandLogo: mark + texto "Radar Auto"
 */
import { Zap } from "lucide-react";

export interface BrandMarkProps {
  size?: number;
}

export function BrandMark({ size = 40 }: BrandMarkProps): JSX.Element {
  return (
    <div
      className="sb-mark"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
      }}
    >
      <Zap size={Math.round(size * 0.52)} fill="currentColor" />
    </div>
  );
}

export interface BrandLogoProps {
  size?: number;
}

export function BrandLogo({ size = 40 }: BrandLogoProps): JSX.Element {
  return (
    <div className="auth-brand">
      <BrandMark size={size} />
      <span className="sb-name">
        Radar<b>Auto</b>
      </span>
    </div>
  );
}
