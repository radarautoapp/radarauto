/**
 * useWizard
 *
 * Hook genérico pra wizards multi-step. Cuida da mecânica de navegação,
 * direção de animação, validação por step e pré-checks assíncronos.
 *
 * O consumidor controla:
 *  - a lista de steps (array de chaves, pode mudar dinamicamente)
 *  - validateStep(key) → se pode avançar daquele step
 *  - onBeforeNext(key) → pré-check async opcional; retorna string (erro) ou null (ok)
 *  - onComplete() → chamado ao avançar do último step
 *
 * Genérico em K (tipo das chaves de step).
 */
import { useCallback, useMemo, useState } from "react";

export type WizardDirection = "forward" | "back";

export interface UseWizardOptions<K extends string> {
  steps: K[];
  /** Pode avançar a partir do step atual? (validação síncrona) */
  validateStep?: (key: K) => boolean;
  /**
   * Pré-check assíncrono antes de avançar. Retorna mensagem de erro pra
   * bloquear, ou null pra liberar. Ex: checar email duplicado.
   */
  onBeforeNext?: (key: K) => Promise<string | null>;
  /** Chamado ao tentar avançar do último step. */
  onComplete?: () => Promise<void> | void;
}

export interface WizardApi<K extends string> {
  steps: K[];
  currentStep: K;
  stepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  direction: WizardDirection;
  /** validateStep(current) === true */
  canAdvance: boolean;
  /** true durante onBeforeNext ou onComplete */
  busy: boolean;
  /** erro retornado pelo onBeforeNext */
  error: string | null;
  setError: (msg: string | null) => void;
  goNext: () => Promise<void>;
  goBack: () => void;
  goTo: (index: number, direction?: WizardDirection) => void;
  reset: () => void;
}

export function useWizard<K extends string>(options: UseWizardOptions<K>): WizardApi<K> {
  const { steps, validateStep, onBeforeNext, onComplete } = options;

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<WizardDirection>("forward");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clamp do index caso a lista de steps encolha (ex: troca de tipo de conta)
  const safeIndex = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const currentStep = steps[safeIndex]!;
  const isFirstStep = safeIndex === 0;
  const isLastStep = safeIndex === steps.length - 1;

  const canAdvance = useMemo(
    () => (validateStep ? validateStep(currentStep) : true),
    [validateStep, currentStep],
  );

  const goTo = useCallback(
    (index: number, dir: WizardDirection = "forward"): void => {
      if (index < 0 || index >= steps.length) return;
      setDirection(dir);
      setStepIndex(index);
      setError(null);
    },
    [steps.length],
  );

  const goBack = useCallback((): void => {
    if (safeIndex === 0 || busy) return;
    setDirection("back");
    setStepIndex(safeIndex - 1);
    setError(null);
  }, [safeIndex, busy]);

  const goNext = useCallback(async (): Promise<void> => {
    if (busy) return;
    if (validateStep && !validateStep(currentStep)) return;

    // Pré-check assíncrono
    if (onBeforeNext) {
      setBusy(true);
      setError(null);
      try {
        const errMsg = await onBeforeNext(currentStep);
        if (errMsg) {
          setError(errMsg);
          return;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
        return;
      } finally {
        setBusy(false);
      }
    }

    // Último step → complete
    if (isLastStep) {
      if (onComplete) {
        setBusy(true);
        setError(null);
        try {
          await onComplete();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Algo deu errado.");
        } finally {
          setBusy(false);
        }
      }
      return;
    }

    // Avança
    setDirection("forward");
    setStepIndex(safeIndex + 1);
    setError(null);
  }, [busy, validateStep, currentStep, onBeforeNext, isLastStep, onComplete, safeIndex]);

  const reset = useCallback((): void => {
    setStepIndex(0);
    setDirection("forward");
    setBusy(false);
    setError(null);
  }, []);

  return {
    steps,
    currentStep,
    stepIndex: safeIndex,
    totalSteps: steps.length,
    isFirstStep,
    isLastStep,
    direction,
    canAdvance,
    busy,
    error,
    setError,
    goNext,
    goBack,
    goTo,
    reset,
  };
}
