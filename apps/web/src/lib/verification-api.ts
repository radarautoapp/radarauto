/**
 * lib/verification-api.ts
 *
 * Wrapper tipado pros endpoints de verificação.
 * Cobre ambos os canais: phone e email.
 */
import type {
  ConfirmEmailVerificationRequest,
  ConfirmPhoneVerificationRequest,
  ConfirmVerificationResponse,
  LastCodeDevResponse,
  SendEmailVerificationRequest,
  SendPhoneVerificationRequest,
  SendVerificationResponse,
} from "@radar/types";

import { apiFetch } from "./api";

export const verificationApi = {
  /* phone */

  async sendPhone(body: SendPhoneVerificationRequest): Promise<SendVerificationResponse> {
    return apiFetch<SendVerificationResponse>("/verification/phone/send", {
      method: "POST",
      body,
      skipAuth: true,
    });
  },

  async confirmPhone(body: ConfirmPhoneVerificationRequest): Promise<ConfirmVerificationResponse> {
    return apiFetch<ConfirmVerificationResponse>("/verification/phone/confirm", {
      method: "POST",
      body,
      skipAuth: true,
    });
  },

  async lastPhoneCodeDev(phone: string): Promise<LastCodeDevResponse> {
    const clean = phone.replace(/\D/g, "");
    return apiFetch<LastCodeDevResponse>(`/verification/phone/last-code/${clean}`, {
      skipAuth: true,
    });
  },

  /* email */

  async sendEmail(body: SendEmailVerificationRequest): Promise<SendVerificationResponse> {
    return apiFetch<SendVerificationResponse>("/verification/email/send", {
      method: "POST",
      body,
      skipAuth: true,
    });
  },

  async confirmEmail(body: ConfirmEmailVerificationRequest): Promise<ConfirmVerificationResponse> {
    return apiFetch<ConfirmVerificationResponse>("/verification/email/confirm", {
      method: "POST",
      body,
      skipAuth: true,
    });
  },

  async lastEmailCodeDev(email: string): Promise<LastCodeDevResponse> {
    return apiFetch<LastCodeDevResponse>(
      `/verification/email/last-code/${encodeURIComponent(email)}`,
      { skipAuth: true },
    );
  },
};
