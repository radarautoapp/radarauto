/**
 * OtpStep — componente reutilizável de input OTP de 6 dígitos.
 *
 * Lida com: auto-advance, backspace, paste, auto-submit ao completar, cooldown,
 * exibição do código em dev. Polimórfico via canal (email | phone).
 */
"use client";

import { AlertCircle, Check } from "lucide-react";
import type { ComponentType, CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import { ApiClientError } from "@/lib/api";

const IS_DEV = process.env.NODE_ENV !== "production";

export interface OtpStepProps {
  channel: "email" | "phone";
  target: string;
  maskedTarget: string;
  icon: ComponentType<{ size?: number; color?: string; style?: CSSProperties }>;
  title: string;
  tokenAlreadySet: boolean;
  onVerified: (token: string) => void;
  send: (t: string) => Promise<{ cooldownSeconds: number; expiresAt: string }>;
  confirm: (t: string, code: string) => Promise<{ verificationToken: string }>;
  getLastCodeDev: (t: string) => Promise<{ code: string }>;
}

export function OtpStep({
  channel,
  target,
  maskedTarget,
  icon: Icon,
  title,
  tokenAlreadySet,
  onVerified,
  send,
  confirm,
  getLastCodeDev,
}: OtpStepProps): JSX.Element {
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (sentTo === target || tokenAlreadySet) return;
    void sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async (): Promise<void> => {
    setError(null);
    setSending(true);
    setDevCode(null);
    try {
      const res = await send(target);
      setSentTo(target);
      setCooldown(res.cooldownSeconds);
      setCode(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setSending(false);
    }
  };

  const confirmCode = async (full: string): Promise<void> => {
    if (full.length !== 6 || confirming || tokenAlreadySet) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await confirm(target, full);
      onVerified(res.verificationToken);
    } catch (err) {
      setError(toFriendlyError(err));
      setCode(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } finally {
      setConfirming(false);
    }
  };

  const onDigitChange = (idx: number, val: string): void => {
    const digit = val.replace(/\D/g, "").slice(0, 1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) inputsRef.current[idx + 1]?.focus();
    const full = next.join("");
    if (full.length === 6) void confirmCode(full);
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
    const lastIdx = Math.min(pasted.length, 5);
    inputsRef.current[lastIdx]?.focus();
    if (pasted.length === 6) void confirmCode(pasted);
  };

  const showDevCode = async (): Promise<void> => {
    try {
      const res = await getLastCodeDev(target);
      setDevCode(res.code);
    } catch {
      setDevCode("indisponível");
    }
  };

  return (
    <>
      <h1 className="wiz-title">
        <Icon
          size={20}
          color="var(--primary)"
          style={{ display: "inline", marginRight: 6, verticalAlign: -2 }}
        />
        {title}
      </h1>
      <p className="wiz-sub" style={{ marginBottom: 14 }}>
        Para <strong>{maskedTarget}</strong>
      </p>

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
            disabled={sending || confirming || tokenAlreadySet}
            inputMode="numeric"
            maxLength={1}
            autoComplete="one-time-code"
            aria-label={`Dígito ${i + 1}`}
          />
        ))}
      </div>

      {error && (
        <div className="auth-error" role="alert" style={{ marginTop: 10 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {tokenAlreadySet && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 14px",
            background: "var(--success-t)",
            borderRadius: 12,
            color: "var(--success)",
            fontSize: 13.5,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Check size={16} />
          {channel === "email" ? "Email verificado!" : "Telefone verificado!"}
        </div>
      )}

      <div className="otp-meta">
        <span>
          {sending && "Enviando código..."}
          {!sending && confirming && "Verificando código..."}
          {!sending && !confirming && !tokenAlreadySet && "Não recebeu o código?"}
        </span>
        <button
          type="button"
          className="otp-resend"
          onClick={() => void sendCode()}
          disabled={sending || cooldown > 0 || tokenAlreadySet}
        >
          {cooldown > 0 ? (
            <span className="otp-cooldown">Reenviar em {cooldown}s</span>
          ) : (
            "Reenviar código"
          )}
        </button>
      </div>

      {IS_DEV && !tokenAlreadySet && (
        <div className="otp-dev-hint">
          <div>
            <strong>Modo desenvolvimento.</strong> O código foi logado no console da API.
          </div>
          {devCode && (
            <div>
              Último código: <span className="code-preview">{devCode}</span>
            </div>
          )}
          <button type="button" onClick={() => void showDevCode()}>
            Mostrar código
          </button>
        </div>
      )}
    </>
  );
}
