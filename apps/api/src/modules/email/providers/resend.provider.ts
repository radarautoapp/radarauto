/**
 * ResendEmailProvider
 *
 * Provider de produção. Usa o SDK oficial do Resend (resend.com).
 *
 * Env vars necessárias:
 *   RESEND_API_KEY=re_xxx
 *   EMAIL_FROM="RadarAuto <noreply@seu-dominio.com>"
 */
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

import { IEmailService, SendEmailOptions } from "../email.interface";

@Injectable()
export class ResendEmailProvider implements IEmailService {
  private readonly logger = new Logger(ResendEmailProvider.name);
  private readonly client: Resend;
  private readonly defaultFrom: string;

  constructor(private readonly config: ConfigService) {
    // Lazy: nao explode no boot se EMAIL_PROVIDER=mock e RESEND_API_KEY faltar.
    // Valida apenas quando send() for chamado.
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    this.client = apiKey ? new Resend(apiKey) : (null as unknown as Resend);
    this.defaultFrom = this.config.get<string>("EMAIL_FROM") ?? "RadarAuto <onboarding@resend.dev>";
  }

  async send(opts: SendEmailOptions): Promise<void> {
    if (!this.client) {
      throw new InternalServerErrorException({
        code: "EMAIL_NOT_CONFIGURED",
        message: "Servico de email nao esta configurado. Defina RESEND_API_KEY.",
      });
    }
    const { data, error } = await this.client.emails.send({
      from: opts.from ?? this.defaultFrom,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });

    if (error) {
      this.logger.error({
        msg: "email.resend.failed",
        to: opts.to,
        subject: opts.subject,
        error: error.message,
      });
      throw new InternalServerErrorException({
        code: "EMAIL_SEND_FAILED",
        message: "Falha ao enviar email. Tente novamente em instantes.",
      });
    }

    this.logger.log({
      msg: "email.resend.sent",
      to: opts.to,
      subject: opts.subject,
      messageId: data?.id,
    });
  }
}
