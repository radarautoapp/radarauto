/**
 * AuthController
 *
 * Endpoints:
 *   POST /auth/register/revendedor — público
 *   POST /auth/register/lojista — público
 *   POST /auth/register/funcionario — lojista autenticado
 *   POST /auth/login — público
 *   POST /auth/logout — autenticado (revoga session atual)
 *   POST /auth/logout-all — autenticado (revoga todas as sessions do user)
 *   GET  /auth/me — autenticado (retorna user + sessão)
 *   GET  /auth/sessions — autenticado (lista sessões ativas)
 *
 * Controller fino — toda regra está no AuthService (Regras 6, 7).
 */
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { UserRole } from "@prisma/client";
import { Request } from "express";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RoleGuard } from "../../common/guards/role.guard";
import { AuthContext, AuthService } from "./auth.service";
import { CheckCpfDto } from "./dto/check-cpf.dto";
import { CheckEmailDto } from "./dto/check-email.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterFuncionarioDto } from "./dto/register-funcionario.dto";
import { RegisterLojistaDto } from "./dto/register-lojista.dto";
import { RegisterRevendedorDto } from "./dto/register-revendedor.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { AuthenticatedRequestUser } from "./jwt.strategy";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("register/revendedor")
  @HttpCode(HttpStatus.CREATED)
  async registerRevendedor(
    @Body() dto: RegisterRevendedorDto,
    @Req() req: Request,
  ): Promise<ReturnType<AuthService["registerRevendedor"]>> {
    return this.auth.registerRevendedor(dto, this.buildContext(req, dto.email));
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto): Promise<ReturnType<AuthService["refreshAccessToken"]>> {
    return this.auth.refreshAccessToken(dto.sessionId, dto.refreshToken);
  }

  @Public()
  @Post("register/lojista")
  @HttpCode(HttpStatus.CREATED)
  async registerLojista(
    @Body() dto: RegisterLojistaDto,
    @Req() req: Request,
  ): Promise<ReturnType<AuthService["registerLojista"]>> {
    return this.auth.registerLojista(dto, this.buildContext(req, dto.email));
  }

  @Post("register/funcionario")
  @Roles(UserRole.lojista)
  @UseGuards(RoleGuard)
  async registerFuncionario(
    @Body() dto: RegisterFuncionarioDto,
    @CurrentUser() actor: AuthenticatedRequestUser,
  ): Promise<ReturnType<AuthService["registerFuncionario"]>> {
    return this.auth.registerFuncionario(dto, actor);
  }

  @Public()
  @Post("check-email")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async checkEmail(@Body() dto: CheckEmailDto): Promise<{ available: boolean }> {
    const available = await this.auth.isEmailAvailable(dto.email);
    return { available };
  }

  @Public()
  @Post("check-cpf")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async checkCpf(@Body() dto: CheckCpfDto): Promise<{ available: boolean }> {
    const available = await this.auth.isCpfAvailable(dto.cpf);
    return { available };
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<ReturnType<AuthService["login"]>> {
    return this.auth.login(dto, this.buildContext(req, dto.email, dto.deviceLabel));
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: AuthenticatedRequestUser): Promise<void> {
    await this.auth.logout(user.sessionId);
  }

  @Post("logout-all")
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: AuthenticatedRequestUser): Promise<{ revoked: number }> {
    return this.auth.logoutAll(user.id);
  }

  @Get("me")
  me(@CurrentUser() user: AuthenticatedRequestUser): {
    user: Omit<AuthenticatedRequestUser, "sessionId">;
    session: { id: string };
  } {
    const { sessionId, ...rest } = user;
    return { user: rest, session: { id: sessionId } };
  }

  @Get("sessions")
  async sessions(@CurrentUser() user: AuthenticatedRequestUser): Promise<
    Array<{
      id: string;
      ipAddress: string | null;
      deviceLabel: string | null;
      lastSeenAt: Date;
      createdAt: Date;
      isCurrent: boolean;
    }>
  > {
    const list = await this.auth.listActiveSessions(user.id);
    return list.map((s) => ({ ...s, isCurrent: s.id === user.sessionId }));
  }

  private buildContext(req: Request, _email: string, deviceLabel?: string): AuthContext {
    const xff = req.headers["x-forwarded-for"];
    const ip = (Array.isArray(xff) ? xff[0] : xff?.split(",")[0]?.trim()) ?? req.ip ?? undefined;
    const ua = req.get("user-agent") ?? undefined;
    return { ipAddress: ip, userAgent: ua, deviceLabel };
  }
}
