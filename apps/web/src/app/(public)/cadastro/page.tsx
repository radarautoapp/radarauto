/**
 * /cadastro page — Orchestrator do wizard (refatorado pra usar useWizard + WizardShell).
 *
 * A mecânica de navegação agora vem do useWizard. Esta página só cuida do
 * domínio do cadastro: form, tokens, pré-checks, submit.
 *
 * Fluxos:
 *  - Revendedor (8 steps): Tipo → Nome → CPF → Email → Verif-Email → Telefone → Verif-Phone → Senha
 *  - Lojista (10 steps): + CNPJ + Revisão antes do Nome
 */
"use client";

import { Store, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import type { CnpjLookupResponse } from "@radar/types";
import { Button, SuccessModal, useWizard, WizardShell } from "@radar/ui";

import { authApi } from "@/lib/auth-api";
import { toFriendlyError } from "@/lib/error-messages";
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

  const [cpfStepError, setCpfStepError] = useState<string | null>(null);
  const [emailStepError, setEmailStepError] = useState<string | null>(null);
  const [phoneStepError, setPhoneStepError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pwConfirmError, setPwConfirmError] = useState<string | null>(null);

  const steps: StepKey[] = useMemo(
    () => (accountType ? STEPS_BY_TYPE[accountType] : ["type"]),
    [accountType],
  );

  const validateStep = (key: StepKey): boolean => {
    switch (key) {
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

  const onBeforeNext = async (key: StepKey): Promise<string | null> => {
    if (key === "cpf") {
      setCpfStepError(null);
      try {
        const res = await authApi.checkCpf(userForm.cpf);
        if (!res.available) {
          setCpfStepError("Este CPF já está cadastrado.");
          return "Este CPF já está cadastrado.";
        }
        return null;
      } catch (err) {
        const msg = toFriendlyError(err);
        setCpfStepError(msg);
        return msg;
      }
    }
    if (key === "email") {
      setEmailStepError(null);
      try {
        const res = await authApi.checkEmail(userForm.email);
        if (!res.available) {
          setEmailStepError("Este email já está cadastrado.");
          return "Este email já está cadastrado.";
        }
        return null;
      } catch (err) {
        const msg = toFriendlyError(err);
        setEmailStepError(msg);
        return msg;
      }
    }
    return null;
  };

  const submit = async (): Promise<void> => {
    if (!accountType || !emailVerifToken) return;
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
            })
          : await authApi.registerLojista({
              name: userForm.name,
              email: userForm.email,
              phone: userForm.phone,
              cpf: normalizeCpf(userForm.cpf),
              password: userForm.password,
              cnpj: cnpjData?.cnpj ?? cnpjInput.replace(/\D/g, ""),
              emailVerificationToken: emailVerifToken,
            });
      setSession(res.user, res.sessionId);
      setSuccess(true);
    } catch (err) {
      throw new Error(toFriendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const wizard = useWizard<StepKey>({
    steps,
    validateStep,
    onBeforeNext,
    onComplete: submit,
  });

  const { currentStep } = wizard;

  /* Pré-preenche nome com sócio principal ao entrar no step "name" */
  useEffect(() => {
    if (currentStep === "name" && cnpjData && !userTouchedNameRef.current && !userForm.name) {
      const principal = cnpjData.partners[0]?.name;
      if (principal) setUserForm((p) => ({ ...p, name: titleCase(principal) }));
    }
  }, [currentStep, cnpjData, userForm.name]);

  /* Invalida tokens se email/phone mudam após verificar */
  useEffect(() => {
    if (emailVerifToken) setEmailVerifToken(null);
    if (emailStepError) setEmailStepError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userForm.email]);

  useEffect(() => {
    if (phoneVerifToken) setPhoneVerifToken(null);
    if (phoneStepError) setPhoneStepError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userForm.phone]);

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
      void wizard.goNext();
    }
  };

  return (
    <>
      <WizardShell
        wizard={wizard}
        trackIcon={accountType === "lojista" ? Store : UserIcon}
        headerSlot={
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
        }
        nextLabel={wizard.isLastStep ? "Criar conta" : "Continuar"}
        busyLabel={submitting ? "Criando conta..." : "Validando..."}
      >
        {currentStep === "type" && <StepType selected={accountType} onSelect={setAccountType} />}
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
            disabled={wizard.busy}
          />
        )}
        {currentStep === "review" && cnpjData && <StepReview data={cnpjData} />}
        {currentStep === "name" && (
          <StepName
            value={userForm.name}
            onChange={handleNameChange}
            onKeyDown={onInputKeyDown}
            hint={
              cnpjData?.partners[0]?.name ? "Sugerimos com base no CNPJ. Pode editar." : undefined
            }
            disabled={wizard.busy}
          />
        )}
        {currentStep === "cpf" && (
          <StepCpf
            value={userForm.cpf}
            onChange={(v) => setUserForm((p) => ({ ...p, cpf: maskCpf(v) }))}
            onKeyDown={onInputKeyDown}
            disabled={wizard.busy}
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
            disabled={wizard.busy}
            error={emailStepError}
          />
        )}
        {currentStep === "verify-email" && (
          <StepVerifyEmail
            email={userForm.email}
            token={emailVerifToken}
            onVerified={(t) => {
              setEmailVerifToken(t);
              wizard.goTo(wizard.stepIndex + 1, "forward");
            }}
          />
        )}
        {currentStep === "phone" && (
          <StepPhone
            value={userForm.phone}
            onChange={(v) => setUserForm((p) => ({ ...p, phone: maskPhone(v) }))}
            onKeyDown={onInputKeyDown}
            disabled={wizard.busy}
            error={phoneStepError}
          />
        )}
        {currentStep === "verify-phone" && (
          <StepVerifyPhone
            phone={userForm.phone}
            token={phoneVerifToken}
            onVerified={(t) => {
              setPhoneVerifToken(t);
              wizard.goTo(wizard.stepIndex + 1, "forward");
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
            disabled={wizard.busy}
          />
        )}
      </WizardShell>

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
    </>
  );
}
