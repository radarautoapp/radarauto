/**
 * LeadsController
 *
 * Recebe eventos de comportamento do interessado (usuário logado) para
 * alimentar o engine de leads. Todos best-effort: falha não bloqueia a UX.
 *
 * POST /leads/:vehicleId/contact  { channel: "whatsapp" | "telegram" }
 * POST /leads/:vehicleId/view
 * POST /leads/:vehicleId/time     { seconds: number }
 */
import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";

import { SafeUser } from "../auth/auth.service";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { LeadsService } from "./leads.service";

@Controller("leads")
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  async list(@CurrentUser() user: SafeUser) {
    return this.leads.listForStore(user);
  }

  @Post(":vehicleId/contact")
  async contact(
    @CurrentUser() user: SafeUser,
    @Param("vehicleId") vehicleId: string,
    @Body("channel") channel: "whatsapp" | "telegram",
  ): Promise<{ ok: true }> {
    const ch = channel === "telegram" ? "telegram" : "whatsapp";
    await this.leads.track(user, vehicleId, { type: "contact", channel: ch });
    return { ok: true };
  }

  @Post(":vehicleId/view")
  async view(
    @CurrentUser() user: SafeUser,
    @Param("vehicleId") vehicleId: string,
  ): Promise<{ ok: true }> {
    await this.leads.track(user, vehicleId, { type: "view" });
    return { ok: true };
  }

  @Post(":vehicleId/time")
  async time(
    @CurrentUser() user: SafeUser,
    @Param("vehicleId") vehicleId: string,
    @Body("seconds") seconds: number,
  ): Promise<{ ok: true }> {
    await this.leads.track(user, vehicleId, {
      type: "time",
      seconds: typeof seconds === "number" ? seconds : 0,
    });
    return { ok: true };
  }
}
