/**
 * VerificationController
 *
 * 6 endpoints públicos (3 por canal):
 *  POST /verification/phone/send
 *  POST /verification/phone/confirm
 *  GET  /verification/phone/last-code/:phone   (DEV only)
 *  POST /verification/email/send
 *  POST /verification/email/confirm
 *  GET  /verification/email/last-code/:email   (DEV only)
 *
 * Rate limiting agressivo (5-10 req/min por IP) pra prevenir DoS.
 */
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import type {
  ConfirmVerificationResponse,
  LastCodeDevResponse,
  SendVerificationResponse,
} from "@radar/types";

import { Public } from "../../common/decorators/public.decorator";
import { ConfirmEmailDto, ConfirmPhoneDto, SendEmailDto, SendPhoneDto } from "./verification.dto";
import { VerificationService } from "./verification.service";

@Controller("verification")
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  /* -------------------------- PHONE -------------------------- */

  @Public()
  @Post("phone/send")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async sendPhone(
    @Body() dto: SendPhoneDto,
    @Req() req: Request,
  ): Promise<SendVerificationResponse> {
    // SMS desabilitado temporariamente. Nenhum codigo e enviado por telefone.
    // O telefone continua sendo coletado, mas sem verificacao por SMS.
    // TODO: restaurar o corpo original quando o provider de SMS estiver pronto.
    void dto;
    void req;
    throw new ServiceUnavailableException({
      code: "SMS_DISABLED",
      message: "Verificação por SMS está temporariamente indisponível.",
    });
  }

  @Public()
  @Post("phone/confirm")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async confirmPhone(@Body() dto: ConfirmPhoneDto): Promise<ConfirmVerificationResponse> {
    const result = await this.verificationService.confirm("phone", dto.phone, dto.code);
    return {
      verificationToken: result.verificationToken,
      expiresAt: result.expiresAt.toISOString(),
    };
  }

  @Public()
  @Get("phone/last-code/:phone")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async lastPhoneCodeDev(@Param("phone") phone: string): Promise<LastCodeDevResponse> {
    if (process.env.NODE_ENV === "production") {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Endpoint não disponível." });
    }
    const entry = this.verificationService.getLastCodeDev("phone", phone);
    return { code: entry.code, expiresAt: entry.expiresAt.toISOString() };
  }

  /* -------------------------- EMAIL -------------------------- */

  @Public()
  @Post("email/send")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async sendEmail(
    @Body() dto: SendEmailDto,
    @Req() req: Request,
  ): Promise<SendVerificationResponse> {
    const ip = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const result = await this.verificationService.send("email", dto.email, ip);
    return {
      expiresAt: result.expiresAt.toISOString(),
      cooldownSeconds: result.cooldownSeconds,
      attemptsRemaining: result.attemptsRemaining,
    };
  }

  @Public()
  @Post("email/confirm")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async confirmEmail(@Body() dto: ConfirmEmailDto): Promise<ConfirmVerificationResponse> {
    const result = await this.verificationService.confirm("email", dto.email, dto.code);
    return {
      verificationToken: result.verificationToken,
      expiresAt: result.expiresAt.toISOString(),
    };
  }

  @Public()
  @Get("email/last-code/:email")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async lastEmailCodeDev(@Param("email") email: string): Promise<LastCodeDevResponse> {
    if (process.env.NODE_ENV === "production") {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Endpoint não disponível." });
    }
    const entry = this.verificationService.getLastCodeDev("email", email);
    return { code: entry.code, expiresAt: entry.expiresAt.toISOString() };
  }
}
