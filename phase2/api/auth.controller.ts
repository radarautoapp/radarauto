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
import { UserRole } from "@prisma/client";
import { Request } from "express";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RoleGuard } from "../../common/guards/role.guard";
import { AuthContext, AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterFuncionarioDto } from "./dto/register-funcionario.dto";
import { RegisterLojistaDto } from "./dto/register-lojista.dto";
import { RegisterRevendedorDto } from "./dto/register-revendedor.dto";
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
    sessionId: string;
  } {
    const { sessionId, ...rest } = user;
    return { user: rest, sessionId };
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
