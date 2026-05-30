/**
 * MockEmailProvider
 *
 * Dev only. Loga email no console + guarda o último por destinatário em memória,
 * pra que o dev possa "ver" o que seria enviado sem precisar de SMTP.
 *
 * Espelha o padrão do MockSmsProvider (verification module).
 */
import { Injectable, Logger } from "@nestjs/common";

import { IEmailService, SendEmailOptions } from "../email.interface";

interface CapturedEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
  sentAt: Date;
}

@Injectable()
export class MockEmailProvider implements IEmailService {
  private readonly logger = new Logger(MockEmailProvider.name);
  private readonly lastByRecipient = new Map<string, CapturedEmail>();

  async send(opts: SendEmailOptions): Promise<void> {
    const captured: CapturedEmail = {
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      sentAt: new Date(),
    };
    this.lastByRecipient.set(opts.to.toLowerCase(), captured);

    this.logger.log({
      msg: "email.mock.sent",
      to: opts.to,
      subject: opts.subject,
    });
    // Em dev, imprime o conteúdo completo
    if (opts.text) {
      this.logger.debug(`\n📧 Para: ${opts.to}\n📋 ${opts.subject}\n${opts.text}\n`);
    }
  }

  /** Helper dev: retorna o último email enviado pra esse destinatário. */
  getLast(to: string): CapturedEmail | undefined {
    return this.lastByRecipient.get(to.toLowerCase());
  }
}
