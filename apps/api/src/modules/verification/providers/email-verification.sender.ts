/**
 * EmailVerificationSender
 *
 * Provider de verificação por email que envia DE VERDADE via EMAIL_SERVICE
 * (Resend em produção). Implementa VerificationProvider (Strategy) e monta o
 * template HTML do código OTP com a identidade visual do RadarAuto.
 *
 * Substitui o MockEmailProvider quando EMAIL_PROVIDER=resend.
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import type { VerificationProvider } from "./verification-provider.interface";

import { EMAIL_SERVICE, IEmailService } from "../../email/email.interface";
import { otpEmailTemplate } from "../templates/otp-email.template";

@Injectable()
export class EmailVerificationSender implements VerificationProvider {
  readonly channel = "email" as const;
  readonly name = "resend-email";
  private readonly logger = new Logger(EmailVerificationSender.name);

  constructor(@Inject(EMAIL_SERVICE) private readonly email: IEmailService) {}

  async send(target: string, code: string): Promise<void> {
    const { subject, html, text } = otpEmailTemplate(code);
    await this.email.send({ to: target, subject, html, text });
    this.logger.log({ msg: "verification.email.sent", to: this.mask(target) });
  }

  private mask(email: string): string {
    const [user, domain] = email.split("@");
    if (!user || !domain) return email;
    if (user.length <= 2) return `${user[0] ?? ""}***@${domain}`;
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
  }
}
