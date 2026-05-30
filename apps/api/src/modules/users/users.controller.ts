/**
 * UsersController
 *
 * Endpoints autenticados:
 *   PATCH /users/me           — atualiza nome/phone (phone exige token)
 *   PATCH /users/me/password  — troca senha + revoga outras sessões
 */
import { Body, Controller, HttpCode, HttpStatus, Patch, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { SafeUser, UsersService } from "./users.service";

interface JwtRequest {
  user?: {
    id: string;
    sessionId: string;
  };
}

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch("me")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async updateProfile(
    @CurrentUser() user: SafeUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<{ user: SafeUser }> {
    const updated = await this.users.updateProfile(user.id, dto);
    return { user: updated };
  }

  @Patch("me/password")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async changePassword(
    @CurrentUser() user: SafeUser,
    @Req() req: JwtRequest,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ revokedSessions: number }> {
    const sid = req.user?.sessionId;
    if (!sid) {
      throw new Error("Session ID ausente no JWT.");
    }
    return this.users.changePassword(user.id, sid, dto);
  }
}
