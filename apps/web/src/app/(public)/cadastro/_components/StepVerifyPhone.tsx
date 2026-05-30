/**
 * StepVerifyPhone — wrapper sobre OtpStep configurado pro canal phone.
 */
import { ShieldCheck } from "lucide-react";

import { verificationApi } from "@/lib/verification-api";

import { maskPhone } from "./masks";
import { OtpStep } from "./OtpStep";

export interface StepVerifyPhoneProps {
  phone: string;
  token: string | null;
  onVerified: (token: string) => void;
}

export function StepVerifyPhone({ phone, token, onVerified }: StepVerifyPhoneProps): JSX.Element {
  const digits = phone.replace(/\D/g, "");
  return (
    <OtpStep
      channel="phone"
      target={digits}
      maskedTarget={maskPhone(digits)}
      icon={ShieldCheck}
      title="Confirme seu telefone"
      tokenAlreadySet={token !== null}
      onVerified={onVerified}
      send={(t) => verificationApi.sendPhone({ phone: t })}
      confirm={(t, code) => verificationApi.confirmPhone({ phone: t, code })}
      getLastCodeDev={(t) => verificationApi.lastPhoneCodeDev(t)}
    />
  );
}
