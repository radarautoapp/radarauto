/**
 * WizardShell
 *
 * Layout visual de wizard multi-step. Casca reutilizável: header (brand + slot),
 * track de progresso, card com o step atual (animado), footer com Voltar/Continuar.
 *
 * A mecânica vem do useWizard (passado via prop `wizard`).
 * O conteúdo do step atual vem via children (renderizado pelo consumidor).
 *
 * Uso:
 *   const wizard = useWizard({ steps, validateStep, onBeforeNext, onComplete });
 *   <WizardShell
 *     wizard={wizard}
 *     trackIcon={Store}
 *     headerSlot={<a href="/login">Entrar</a>}
 *     nextLabel={wizard.isLastStep ? "Criar conta" : "Continuar"}
 *     busyLabel="Salvando..."
 *   >
 *     {renderCurrentStep()}
 *   </WizardShell>
 */
"use client";

import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { BrandLogo } from "./Brand";
import { Button } from "./Button";
import { WizardTrack } from "./WizardTrack";
import type { WizardApi } from "./useWizard";

export interface WizardShellProps<K extends string> {
  wizard: WizardApi<K>;
  children: ReactNode;
  /** Ícone do track de progresso */
  trackIcon?: ComponentType<{ size?: number }>;
  /** Slot à direita do brand no header (ex: link "Já tem conta? Entrar") */
  headerSlot?: ReactNode;
  /** Mostra o BrandLogo no header (default true) */
  showBrand?: boolean;
  /** Label do botão avançar (default "Continuar") */
  nextLabel?: string;
  /** Label do botão avançar enquanto busy (default "Salvando...") */
  busyLabel?: string;
  /** Label do botão voltar (default "Voltar") */
  backLabel?: string;
  /** Esconde o footer inteiro (pra steps com navegação própria) */
  hideFooter?: boolean;
  /** Erro a exibir acima do footer (além do wizard.error) */
  extraError?: string | null;
}

export function WizardShell<K extends string>({
  wizard,
  children,
  trackIcon,
  headerSlot,
  showBrand = true,
  nextLabel = "Continuar",
  busyLabel = "Salvando...",
  backLabel = "Voltar",
  hideFooter = false,
  extraError = null,
}: WizardShellProps<K>): JSX.Element {
  const animClass = wizard.direction === "forward" ? "enter-right" : "enter-left";
  const displayError = wizard.error ?? extraError;

  return (
    <main className="wiz-shell">
      <div className="wiz-head">
        <div style={{ maxWidth: 680, width: "100%" }}>
          {(showBrand || headerSlot) && (
            <div className="wiz-brand-row">
              {showBrand ? <BrandLogo /> : <span />}
              {headerSlot}
            </div>
          )}
          <WizardTrack
            totalSteps={wizard.totalSteps}
            activeIndex={wizard.stepIndex}
            icon={trackIcon}
          />
        </div>
      </div>

      <div className="wiz-body">
        <div className="wiz-card">
          <div
            key={`${wizard.currentStep}-${wizard.stepIndex}`}
            className={`wiz-step-content ${animClass}`}
          >
            {children}

            {displayError && (
              <div className="auth-error" role="alert" style={{ marginTop: 16 }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{displayError}</span>
              </div>
            )}
          </div>

          {!hideFooter && (
            <div className={`wiz-foot${wizard.isFirstStep ? " first" : ""}`}>
              <Button
                variant="ghost"
                icon={ArrowLeft}
                onClick={wizard.goBack}
                disabled={wizard.busy || wizard.isFirstStep}
                className="wiz-back"
              >
                {backLabel}
              </Button>
              <Button
                variant="primary"
                iconRight={wizard.isLastStep ? undefined : ArrowRight}
                onClick={() => void wizard.goNext()}
                disabled={!wizard.canAdvance || wizard.busy}
                loading={wizard.busy}
              >
                {wizard.busy ? busyLabel : nextLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
