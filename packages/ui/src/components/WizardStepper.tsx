/**
 * WizardStepper
 *
 * Barra de progresso de wizard com bolinhas numeradas + linhas conectoras.
 * Step ativo destacado em azul, concluídos em verde com check.
 *
 * Steps recebidos como array de labels (a quantidade vira o total).
 * activeIndex = 0-based.
 */
import { Check } from "lucide-react";

export interface WizardStepperProps {
  steps: string[];
  activeIndex: number;
}

export function WizardStepper({ steps, activeIndex }: WizardStepperProps): JSX.Element {
  return (
    <div
      className="wiz-stepper"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-valuenow={activeIndex + 1}
    >
      {steps.map((label, idx) => {
        const isDone = idx < activeIndex;
        const isActive = idx === activeIndex;
        const state = isDone ? "done" : isActive ? "active" : "";
        const lineState = isDone ? "done" : "";
        return (
          <div key={label} style={{ display: "contents" }}>
            <div className={`wiz-step ${state}`}>
              <div className="wiz-step-bullet">
                {isDone ? <Check size={16} strokeWidth={3} /> : idx + 1}
              </div>
              <div className="wiz-step-label">{label}</div>
            </div>
            {idx < steps.length - 1 && <div className={`wiz-step-line ${lineState}`} />}
          </div>
        );
      })}
    </div>
  );
}
