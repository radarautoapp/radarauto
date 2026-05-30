/**
 * MockEmailProvider
 *
 * Loga o código de email no console em dev. Nunca envia em produção.
 * Substituível por Resend/SendGrid/SES quando integrar.
 */
import { Injectable, Logger } from "@nestjs/common";

import { VerificationProvider } from "./verification-provider.interface";

@Injectable()
export class MockEmailProvider implements VerificationProvider {
  readonly channel = "email" as const;
  readonly name = "mock-email";
  private readonly logger = new Logger(MockEmailProvider.name);

  async send(email: string, code: string): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      this.logger.warn({
        msg: "MockEmailProvider em uso em PRODUÇÃO — email NÃO enviado.",
        email: this.mask(email),
      });
      return;
    }
    this.logger.log(
      `\n========================================\n` +
        `📧 [MOCK EMAIL] Código de verificação\n` +
        `   Email:    ${this.mask(email)}\n` +
        `   Código:   ${code}\n` +
        `========================================\n`,
    );
  }

  private mask(email: string): string {
    const [user, domain] = email.split("@");
    if (!user || !domain) return email;
    if (user.length <= 2) return `${user[0] ?? ""}***@${domain}`;
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
  }
}
