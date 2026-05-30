/**
 * StepVerifyEmail — wrapper sobre OtpStep configurado pro canal email.
 */
import { Mail } from "lucide-react";

import { verificationApi } from "@/lib/verification-api";

import { maskEmail } from "./masks";
import { OtpStep } from "./OtpStep";

export interface StepVerifyEmailProps {
  email: string;
  token: string | null;
  onVerified: (token: string) => void;
}

export function StepVerifyEmail({ email, token, onVerified }: StepVerifyEmailProps): JSX.Element {
  return (
    <OtpStep
      channel="email"
      target={email}
      maskedTarget={maskEmail(email)}
      icon={Mail}
      title="Confirme seu email"
      tokenAlreadySet={token !== null}
      onVerified={onVerified}
      send={(t) => verificationApi.sendEmail({ email: t })}
      confirm={(t, code) => verificationApi.confirmEmail({ email: t, code })}
      getLastCodeDev={(t) => verificationApi.lastEmailCodeDev(t)}
    />
  );
}
