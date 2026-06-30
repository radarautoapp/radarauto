/**
 * EditPhoneModal — edita telefone com OTP em sub-step.
 * Mostra success por ~1.5s antes de fechar.
 */
"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button, FormField, Input } from "@radar/ui";

import { ApiClientError } from "@/lib/api";
import { toFriendlyError } from "@/lib/error-messages";
import { usersApi } from "@/lib/users-api";
import { verificationApi } from "@/lib/verification-api";
import { useAuthStore } from "@/stores/auth.store";

import { EditFieldModal, type EditFieldModalSuccess } from "./EditFieldModal";

const IS_DEV = process.env.NODE_ENV !== "production";

function maskPhone(raw: string): string {
  const digits = (raw ?? "").replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

type Step = "input" | "otp";

export interface EditPhoneModalProps {
  open: boolean;
  currentPhone: string;
  onClose: () => void;
}

export function EditPhoneModal({ open, currentPhone, onClose }: EditPhoneModalProps): JSX.Element {
  const setSession = useAuthStore((s) => s.setSession);
  const sessionId = useAuthStore((s) => s.sessionId);

  const [phone, setPhone] = useState(maskPhone(currentPhone));
  const [step, setStep] = useState<Step>("input");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<EditFieldModalSuccess | null>(null);

  useEffect(() => {
    if (open) {
      setPhone(maskPhone(currentPhone));
      setStep("input");
      setError(null);
      setSuccess(null);
      setBusy(false);
    }
  }, [open, currentPhone]);

  const originalDigits = currentPhone.replace(/\D/g, "");
  const newDigits = phone.replace(/\D/g, "");
  const changed = newDigits !== originalDigits;
  const isValid = newDigits.length >= 10;

  // SMS desabilitado: salva o telefone direto, sem verificacao por codigo.
  // TODO: reativar o fluxo de OTP (setStep("otp")) quando o SMS estiver pronto.
  const goToOtp = async (): Promise<void> => {
    if (!isValid || !changed || busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await usersApi.updateProfile({ phone: newDigits });
      if (sessionId) setSession(res.user, sessionId);
      setSuccess({
        title: "Telefone atualizado!",
        description: `Novo número: ${maskPhone(newDigits)}`,
      });
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(toFriendlyError(err));
      setBusy(false);
    }
  };

  const onVerified = async (token: string): Promise<void> => {
    setError(null);
    setBusy(true);
    try {
      const res = await usersApi.updateProfile({
        phone: newDigits,
        phoneVerificationToken: token,
      });
      if (sessionId) setSession(res.user, sessionId);
      setSuccess({
        title: "Telefone confirmado!",
        description: `Novo número: ${maskPhone(newDigits)}`,
      });
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(toFriendlyError(err));
      setBusy(false);
    }
  };

  return (
    <EditFieldModal
      open={open}
      title={step === "input" ? "Editar telefone" : "Confirme o código"}
      description={
        step === "input"
          ? "Vamos enviar um código pra confirmar o novo número."
          : `Enviamos um SMS pra ${maskPhone(newDigits)}.`
      }
      onClose={onClose}
      successState={success}
    >
      {step === "input" && (
        <>
          <FormField label="WhatsApp" htmlFor="phone" hint="Com DDD. Ex.: (47) 99999-0000">
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") void goToOtp();
              }}
              disabled={busy}
              placeholder="(00) 00000-0000"
              inputMode="tel"
              autoComplete="tel"
              autoFocus
              required
            />
          </FormField>

          {error && (
            <div key={error} className="auth-error" role="alert" style={{ marginTop: 12 }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="edit-modal-foot">
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={goToOtp}
              disabled={!isValid || !changed || busy}
              loading={busy}
            >
              {busy ? "Enviando..." : "Continuar"}
            </Button>
          </div>
        </>
      )}

      {step === "otp" && (
        <OtpSubStep
          phone={newDigits}
          onVerified={onVerified}
          onBack={() => setStep("input")}
          externalError={error}
          busyExternal={busy}
        />
      )}
    </EditFieldModal>
  );
}

function OtpSubStep({
  phone,
  onVerified,
  onBack,
  externalError,
  busyExternal,
}: {
  phone: string;
  onVerified: (token: string) => Promise<void>;
  onBack: () => void;
  externalError: string | null;
  busyExternal: boolean;
}): JSX.Element {
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [confirming, setConfirming] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [error, setError] = useState<string | null>(externalError);
  const [devCode, setDevCode] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setTimeout(() => inputsRef.current[0]?.focus(), 100);
  }, []);

  useEffect(() => {
    setError(externalError);
  }, [externalError]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const tryConfirm = async (full: string): Promise<void> => {
    if (full.length !== 6 || confirming || busyExternal) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await verificationApi.confirmPhone({ phone, code: full });
      await onVerified(res.verificationToken);
    } catch (err) {
      setError(toFriendlyError(err));
      setCode(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
      setConfirming(false);
    }
  };

  const resend = async (): Promise<void> => {
    if (cooldown > 0) return;
    setResending(true);
    setError(null);
    setDevCode(null);
    try {
      const res = await verificationApi.sendPhone({ phone });
      setCooldown(res.cooldownSeconds);
      setCode(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setResending(false);
    }
  };

  const onDigitChange = (idx: number, val: string): void => {
    const digit = val.replace(/\D/g, "").slice(0, 1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) inputsRef.current[idx + 1]?.focus();
    const full = next.join("");
    if (full.length === 6) void tryConfirm(full);
  };

  const onDigitKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === "ArrowLeft" && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i] ?? "";
    setCode(next);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
    if (pasted.length === 6) void tryConfirm(pasted);
  };

  const showDev = async (): Promise<void> => {
    try {
      const r = await verificationApi.lastPhoneCodeDev(phone);
      setDevCode(r.code);
    } catch {
      setDevCode("indisponível");
    }
  };

  return (
    <>
      <div className="otp-grid" onPaste={onPaste}>
        {code.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            className={`otp-input${d ? " filled" : ""}${error ? " invalid" : ""}`}
            value={d}
            onChange={(e) => onDigitChange(i, e.target.value)}
            onKeyDown={(e) => onDigitKeyDown(i, e)}
            disabled={confirming || resending || busyExternal}
            inputMode="numeric"
            maxLength={1}
            autoComplete="one-time-code"
            aria-label={`Dígito ${i + 1}`}
          />
        ))}
      </div>

      {error && (
        <div key={error} className="auth-error" role="alert" style={{ marginTop: 10 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      <div className="otp-meta">
        <span>
          {confirming && "Verificando..."}
          {resending && "Reenviando..."}
          {busyExternal && "Salvando..."}
          {!confirming && !resending && !busyExternal && "Não recebeu o código?"}
        </span>
        <button
          type="button"
          className="otp-resend"
          onClick={() => void resend()}
          disabled={cooldown > 0 || resending || confirming || busyExternal}
        >
          {cooldown > 0 ? (
            <span className="otp-cooldown">Reenviar em {cooldown}s</span>
          ) : (
            "Reenviar código"
          )}
        </button>
      </div>

      {IS_DEV && (
        <div className="otp-dev-hint">
          <div>
            <strong>Modo dev.</strong> O código foi logado no console da API.
          </div>
          {devCode && (
            <div>
              Último código: <span className="code-preview">{devCode}</span>
            </div>
          )}
          <button type="button" onClick={() => void showDev()}>
            Mostrar código
          </button>
        </div>
      )}

      <div className="edit-modal-foot">
        <Button
          variant="ghost"
          icon={ArrowLeft}
          onClick={onBack}
          disabled={busyExternal || confirming}
        >
          Alterar número
        </Button>
      </div>
    </>
  );
}
