/**
 * MockSmsProvider
 *
 * Loga o código de SMS no console em dev. Nunca envia em produção.
 * Substituível por Twilio/WhatsApp Cloud quando integrar.
 */
import { Injectable, Logger } from "@nestjs/common";

import { VerificationProvider } from "./verification-provider.interface";

@Injectable()
export class MockSmsProvider implements VerificationProvider {
  readonly channel = "phone" as const;
  readonly name = "mock-sms";
  private readonly logger = new Logger(MockSmsProvider.name);

  async send(phone: string, code: string): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      this.logger.warn({
        msg: "MockSmsProvider em uso em PRODUÇÃO — código NÃO enviado.",
        phone: this.mask(phone),
      });
      return;
    }
    this.logger.log(
      `\n========================================\n` +
        `📱 [MOCK SMS] Código de verificação\n` +
        `   Telefone: ${this.mask(phone)}\n` +
        `   Código:   ${code}\n` +
        `========================================\n`,
    );
  }

  private mask(phone: string): string {
    if (phone.length < 4) return "***";
    return `***${phone.slice(-4)}`;
  }
}
