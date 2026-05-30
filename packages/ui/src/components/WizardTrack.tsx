/**
 * WizardTrack
 *
 * Stepper visual em formato de "trilha": uma linha horizontal preenchida
 * conforme o progresso, com um ícone que se desloca e uma bandeira de
 * chegada no final.
 *
 * Substitui o WizardStepper em wizards onde o usuário quer uma experiência
 * mais lúdica (cadastro multi-step, criação de veículo, etc.).
 *
 * Props:
 *  - totalSteps:  total de etapas (≥ 2)
 *  - activeIndex: índice 0-based do step atual
 *  - icon:        ícone que se desloca (ex.: Store, User, Car)
 *
 * Mudar o ícone faz fade automático (key prop force-remount).
 */
"use client";

import { Flag } from "lucide-react";
import type { ComponentType } from "react";

export interface WizardTrackProps {
  totalSteps: number;
  activeIndex: number;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}

export function WizardTrack({
  totalSteps,
  activeIndex,
  icon: Icon,
}: WizardTrackProps): JSX.Element {
  const safeTotal = Math.max(2, totalSteps);
  const clampedIndex = Math.min(Math.max(activeIndex, 0), safeTotal - 1);
  const progress = (clampedIndex / (safeTotal - 1)) * 100;

  return (
    <div
      className="wiz-track"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={safeTotal}
      aria-valuenow={clampedIndex + 1}
      aria-label={`Passo ${clampedIndex + 1} de ${safeTotal}`}
    >
      <div className="wiz-track-line">
        <div className="wiz-track-fill" style={{ width: `${progress}%` }} />
        <div className="wiz-track-mover" style={{ left: `${progress}%` }}>
          <div key={Icon.displayName ?? Icon.name} className="wiz-track-mover-icon">
            <Icon size={18} strokeWidth={2.4} />
          </div>
        </div>
      </div>

      <div className="wiz-track-flag">
        <Flag size={18} strokeWidth={2.4} />
      </div>
    </div>
  );
}
