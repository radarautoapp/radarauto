/**
 * IEmailService
 *
 * Interface pra envio de emails transacionais.
 * Implementações: MockEmailProvider (dev), ResendEmailProvider (prod).
 *
 * Strategy pattern — igual storage/cnpj.
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  /** HTML do corpo */
  html: string;
  /** Texto plano (fallback pra clients que não renderizam HTML) */
  text?: string;
  /** Remetente (default: do env EMAIL_FROM) */
  from?: string;
}

export interface IEmailService {
  send(opts: SendEmailOptions): Promise<void>;
}

export const EMAIL_SERVICE = Symbol("EMAIL_SERVICE");
