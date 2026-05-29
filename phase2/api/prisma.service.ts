/**
 * PrismaService
 *
 * Propósito: wrapper do PrismaClient como provider NestJS.
 * Singleton acessível por DI em qualquer service.
 *
 * Lifecycle: conecta no boot, desconecta no shutdown.
 */
import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    process.on("beforeExit", () => {
      void app.close();
    });
  }
}
