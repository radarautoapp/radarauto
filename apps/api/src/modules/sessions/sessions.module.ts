/**
 * SessionsModule
 *
 * Endpoints de gestão das próprias sessões + interceptor de lastSeenAt.
 */
import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";

import { PrismaModule } from "../../prisma/prisma.module";
import { LastSeenInterceptor } from "./last-seen.interceptor";
import { SessionsController } from "./sessions.controller";
import { SessionsService } from "./sessions.service";

@Module({
  imports: [PrismaModule],
  controllers: [SessionsController],
  providers: [
    SessionsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LastSeenInterceptor,
    },
  ],
  exports: [SessionsService],
})
export class SessionsModule {}
