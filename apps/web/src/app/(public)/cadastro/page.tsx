/**
 * /cadastro page — Orchestrator do wizard.
 *
 * Gerencia state (form, tokens, erros), navegação (goNext/goBack), submit final.
 * Cada step é um componente isolado em ./_components/.
 *
 * Fluxos:
 *  - Revendedor (8 steps): Tipo → Nome → CPF → Email → Verif-Email → Telefone → Verif-Phone → Senha
 *  - Lojista (10 steps): + CNPJ + Revisão antes do Nome
 */
"use client";

import { AlertCircle, ArrowLeft, ArrowRight, Store, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import type { CnpjLookupResponse } from "@radar/types";
import { BrandLogo, Button, SuccessModal, WizardTrack } from "@radar/ui";

import { ApiClientError } from "@/lib/api";
import { authApi } from "@/lib/auth-api";
import { isValidCpf, maskCpf, normalizeCpf } from "@/lib/cpf";
import { useAuthStore } from "@/stores/auth.store";

import { maskPhone, titleCase } from "./_components/masks";
import { StepCnpj, type CnpjStepError } from "./_components/StepCnpj";
import { StepCpf } from "./_components/StepCpf";
import { StepEmail } from "./_components/StepEmail";
import { StepName } from "./_components/StepName";
import { StepPassword } from "./_components/StepPassword";
import { StepPhone } from "./_components/StepPhone";
import { StepReview } from "./_components/StepReview";
import { StepType } from "./_components/StepType";
import { StepVerifyEmail } from "./_components/StepVerifyEmail";
import { StepVerifyPhone } from "./_components/StepVerifyPhone";
import {
  type AccountType,
  EMPTY_USER,
  STEPS_BY_TYPE,
  type StepKey,
  type UserForm,
} from "./_components/types";

export default function CadastroPage(): JSX.Element {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [accountType, setAccountType] = useState<AccountType | null>("lojista");
  const [userForm, setUserForm] = useState<UserForm>(EMPTY_USER);
  const userTouchedNameRef = useRef(false);

  const [cnpjInput, setCnpjInput] = useState("");
  const [cnpjData, setCnpjData] = useState<CnpjLookupResponse | null>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState<CnpjStepError | null>(null);

  const [emailVerifToken, setEmailVerifToken] = useState<string | null>(null);
  const [phoneVerifToken, setPhoneVerifToken] = useState<string | null>(null);

  const [emailStepError, setEmailStepError] = useState<string | null>(null);
  const [phoneStepError, setPhoneStepError] = useState<string | null>(null);
  const [cpfStepError, setCpfStepError] = useState<string | null>(null);
  const [sendingPrecheck, setSendingPrecheck] = useState(false);

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pwConfirmError, setPwConfirmError] = useState<string | null>(null);

  const steps: StepKey[] = useMemo(
    () => (accountType ? STEPS_BY_TYPE[accountType] : ["type"]),
    [accountType],
  );

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  /* Pré-preenche nome com sócio principal ao entrar no step "name" */
  useEffect(() => {
    if (currentStep === "name" && cnpjData && !userTouchedNameRef.current && !userForm.name) {
      const principal = cnpjData.partners[0]?.name;
      if (principal) setUserForm((p) => ({ ...p, name: titleCase(principal) }));
    }
  }, [currentStep, cnpjData, userForm.name]);

  /* Se email muda após verificar, invalida o token + erro */
  useEffect(() => {
    if (emailVerifToken) setEmailVerifToken(null);
    if (emailStepError) setEmailStepError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userForm.email]);

  /* Se phone muda após verificar, invalida o token + erro */
  useEffect(() => {
    if (phoneVerifToken) setPhoneVerifToken(null);
    if (phoneStepError) setPhoneStepError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userForm.phone]);

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case "type":
        return accountType !== null;
      case "cnpj":
        return cnpjData !== null && cnpjData.status === "ATIVA";
      case "review":
        return cnpjData !== null;
      case "name": {
        const parts = (userForm.name ?? "")
          .trim()
          .split(/\s+/)
          .filter((p) => p.length >= 2);
        return parts.length >= 2;
      }
      case "cpf":
        return isValidCpf(userForm.cpf ?? "");
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email ?? "");
      case "verify-email":
        return emailVerifToken !== null;
      case "phone":
        return (userForm.phone ?? "").replace(/\D/g, "").length >= 10;
      case "verify-phone":
        return phoneVerifToken !== null;
      case "password":
        return (
          (userForm.password ?? "").length >= 8 && userForm.password === userForm.passwordConfirm
        );
      default:
        return false;
    }
  };

  const goNext = async (): Promise<void> => {
    if (!isStepValid() || submitting || sendingPrecheck) return;

    if (currentStep === "cpf") {
      setSendingPrecheck(true);
      setCpfStepError(null);
      try {
        const res = await authApi.checkCpf(userForm.cpf);
        if (!res.available) {
          setCpfStepError("Este CPF já está cadastrado.");
          return;
        }
        setDirection("forward");
        setStepIndex(stepIndex + 1);
      } catch (err) {
        setCpfStepError(toFriendlyError(err));
      } finally {
        setSendingPrecheck(false);
      }
      return;
    }

    if (currentStep === "email") {
      setSendingPrecheck(true);
      setEmailStepError(null);
      try {
        const res = await authApi.checkEmail(userForm.email);
        if (!res.available) {
          setEmailStepError("Este email já está cadastrado.");
          return;
        }
        setDirection("forward");
        setStepIndex(stepIndex + 1);
      } catch (err) {
        setEmailStepError(toFriendlyError(err));
      } finally {
        setSendingPrecheck(false);
      }
      return;
    }

    if (!isLastStep) {
      setDirection("forward");
      setStepIndex(stepIndex + 1);
      return;
    }
    await submit();
  };

  const goBack = (): void => {
    if (stepIndex === 0 || submitting) return;
    setDirection("back");
    setStepIndex(stepIndex - 1);
    setSubmitError(null);
  };

  const submit = async (): Promise<void> => {
    if (!accountType || !emailVerifToken || !phoneVerifToken) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res =
        accountType === "revendedor"
          ? await authApi.registerRevendedor({
              name: userForm.name,
              email: userForm.email,
              phone: userForm.phone,
              cpf: normalizeCpf(userForm.cpf),
              password: userForm.password,
              emailVerificationToken: emailVerifToken,
              phoneVerificationToken: phoneVerifToken,
            })
          : await authApi.registerLojista({
              name: userForm.name,
              email: userForm.email,
              phone: userForm.phone,
              cpf: normalizeCpf(userForm.cpf),
              password: userForm.password,
              cnpj: cnpjData?.cnpj ?? cnpjInput.replace(/\D/g, ""),
              emailVerificationToken: emailVerifToken,
              phoneVerificationToken: phoneVerifToken,
            });
      setSession(res.user, res.sessionId);
      setSuccess(true);
    } catch (err) {
      setSubmitError(toFriendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const animClass = direction === "forward" ? "enter-right" : "enter-left";

  const handleNameChange = (v: string): void => {
    userTouchedNameRef.current = true;
    setUserForm((prev) => ({ ...prev, name: v }));
  };

  const checkPasswordsMatch = (): void => {
    if (!userForm.passwordConfirm) {
      setPwConfirmError(null);
      return;
    }
    setPwConfirmError(
      userForm.password === userForm.passwordConfirm ? null : "As senhas não coincidem.",
    );
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void goNext();
    }
  };

  return (
    <main className="wiz-shell">
      <div className="wiz-head">
        <div style={{ maxWidth: 680, width: "100%" }}>
          <div className="wiz-brand-row">
            <BrandLogo />
            <a
              href="/login"
              style={{
                color: "var(--primary)",
                fontWeight: 600,
                fontSize: 13.5,
                textDecoration: "none",
              }}
            >
              Já tem conta? Entrar
            </a>
          </div>
          <WizardTrack
            totalSteps={steps.length}
            activeIndex={stepIndex}
            icon={accountType === "lojista" ? Store : UserIcon}
          />
        </div>
      </div>

      <div className="wiz-body">
        <div className="wiz-card">
          <div key={`${currentStep}-${stepIndex}`} className={`wiz-step-content ${animClass}`}>
            {currentStep === "type" && (
              <StepType selected={accountType} onSelect={setAccountType} />
            )}
            {currentStep === "cnpj" && (
              <StepCnpj
                cnpjInput={cnpjInput}
                setCnpjInput={setCnpjInput}
                cnpjData={cnpjData}
                setCnpjData={setCnpjData}
                cnpjLoading={cnpjLoading}
                setCnpjLoading={setCnpjLoading}
                cnpjError={cnpjError}
                setCnpjError={setCnpjError}
                disabled={submitting}
              />
            )}
            {currentStep === "review" && cnpjData && <StepReview data={cnpjData} />}
            {currentStep === "name" && (
              <StepName
                value={userForm.name}
                onChange={handleNameChange}
                onKeyDown={onInputKeyDown}
                hint={
                  cnpjData?.partners[0]?.name
                    ? "Sugerimos com base no CNPJ. Pode editar."
                    : undefined
                }
                disabled={submitting}
              />
            )}
            {currentStep === "cpf" && (
              <StepCpf
                value={userForm.cpf}
                onChange={(v) => setUserForm((p) => ({ ...p, cpf: maskCpf(v) }))}
                onKeyDown={onInputKeyDown}
                disabled={submitting || sendingPrecheck}
                error={cpfStepError}
                onValueChange={() => {
                  if (cpfStepError) setCpfStepError(null);
                }}
              />
            )}
            {currentStep === "email" && (
              <StepEmail
                value={userForm.email}
                onChange={(v) => setUserForm((p) => ({ ...p, email: v }))}
                onKeyDown={onInputKeyDown}
                disabled={submitting || sendingPrecheck}
                error={emailStepError}
              />
            )}
            {currentStep === "verify-email" && (
              <StepVerifyEmail
                email={userForm.email}
                token={emailVerifToken}
                onVerified={(t) => {
                  setEmailVerifToken(t);
                  setDirection("forward");
                  setStepIndex((i) => i + 1);
                }}
              />
            )}
            {currentStep === "phone" && (
              <StepPhone
                value={userForm.phone}
                onChange={(v) => setUserForm((p) => ({ ...p, phone: maskPhone(v) }))}
                onKeyDown={onInputKeyDown}
                disabled={submitting || sendingPrecheck}
                error={phoneStepError}
              />
            )}
            {currentStep === "verify-phone" && (
              <StepVerifyPhone
                phone={userForm.phone}
                token={phoneVerifToken}
                onVerified={(t) => {
                  setPhoneVerifToken(t);
                  setDirection("forward");
                  setStepIndex((i) => i + 1);
                }}
              />
            )}
            {currentStep === "password" && (
              <StepPassword
                password={userForm.password}
                passwordConfirm={userForm.passwordConfirm}
                onPasswordChange={(v) => {
                  setUserForm((p) => ({ ...p, password: v }));
                  if (pwConfirmError) setPwConfirmError(null);
                }}
                onPasswordConfirmChange={(v) => {
                  setUserForm((p) => ({ ...p, passwordConfirm: v }));
                  if (pwConfirmError) setPwConfirmError(null);
                }}
                onPasswordConfirmBlur={checkPasswordsMatch}
                pwConfirmError={pwConfirmError}
                onKeyDown={onInputKeyDown}
                disabled={submitting}
              />
            )}

            {submitError && isLastStep && (
              <div className="auth-error" role="alert" style={{ marginTop: 16 }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{submitError}</span>
              </div>
            )}
          </div>

          <div className={`wiz-foot${stepIndex === 0 ? " first" : ""}`}>
            <Button
              variant="ghost"
              icon={ArrowLeft}
              onClick={goBack}
              disabled={submitting}
              className="wiz-back"
            >
              Voltar
            </Button>
            <Button
              variant="primary"
              iconRight={isLastStep ? undefined : ArrowRight}
              onClick={goNext}
              disabled={!isStepValid() || sendingPrecheck}
              loading={submitting || sendingPrecheck}
            >
              {submitting
                ? "Criando conta..."
                : sendingPrecheck
                  ? "Validando..."
                  : isLastStep
                    ? "Criar conta"
                    : "Continuar"}
            </Button>
          </div>
        </div>
      </div>

      <SuccessModal
        open={success}
        title="Conta criada!"
        description={
          accountType === "lojista"
            ? "Sua loja foi cadastrada com sucesso. Vamos te levar para o painel."
            : "Bem-vindo ao RadarAuto. Vamos te levar para o painel."
        }
        ctaLabel="Ir para o painel"
        onCta={() => router.push("/app")}
      />
    </main>
  );
}
