/**
 * EmployeesController
 *
 * Rotas autenticadas (lojista):
 *   GET    /employees            - lista
 *   POST   /employees/invite     - convida
 *   POST   /employees/:id/resend - reenvia convite
 *   DELETE /employees/:id        - remove (soft delete)
 *
 * Rotas públicas (convite com token):
 *   GET  /employees/invite/:token - valida token, retorna info do convite
 *   POST /employees/invite/:token - ativa conta (cria senha + nome)
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { SafeUser } from "../auth/auth.service";
import { AcceptInviteDto, InviteEmployeeDto } from "./dto/employees.dto";
import { EmployeesService, InvitedEmployee } from "./employees.service";

@Controller("employees")
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  // ─── Autenticadas (lojista) ──────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@CurrentUser() user: SafeUser): Promise<{ employees: InvitedEmployee[] }> {
    const employees = await this.employees.list(user);
    return { employees };
  }

  @Post("invite")
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async invite(
    @CurrentUser() user: SafeUser,
    @Body() dto: InviteEmployeeDto,
  ): Promise<{ employee: InvitedEmployee }> {
    const employee = await this.employees.invite(user, dto.email);
    return { employee };
  }

  @Post(":id/resend")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async resend(
    @CurrentUser() user: SafeUser,
    @Param("id") id: string,
  ): Promise<{ employee: InvitedEmployee }> {
    const employee = await this.employees.resendInvite(user, id);
    return { employee };
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: SafeUser, @Param("id") id: string): Promise<void> {
    await this.employees.remove(user, id);
  }

  // ─── Públicas (convite) ──────────────────────────────────────────────

  @Public()
  @Get("invite/:token")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async getInvite(@Param("token") token: string): Promise<{
    email: string;
    storeName: string;
    expiresAt: Date;
  }> {
    return this.employees.getInviteByToken(token);
  }

  @Public()
  @Post("invite/:token")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async acceptInvite(
    @Param("token") token: string,
    @Body() dto: AcceptInviteDto,
  ): Promise<{ userId: string }> {
    return this.employees.acceptInvite(token, dto);
  }
}
