/**
 * StorageModule
 *
 * Provider de armazenamento de arquivos.
 * Escolhe a implementação baseado em STORAGE_PROVIDER:
 *   - "local" → LocalStorageProvider (default, dev)
 *   - "supabase" → SupabaseStorageProvider (prod)
 */
import { Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { LocalStorageProvider } from "./providers/local.provider";
import { SupabaseStorageProvider } from "./providers/supabase.provider";
import { IStorageService, STORAGE_SERVICE } from "./storage.interface";

@Module({
  imports: [ConfigModule],
  providers: [
    LocalStorageProvider,
    SupabaseStorageProvider,
    {
      provide: STORAGE_SERVICE,
      inject: [ConfigService, LocalStorageProvider, SupabaseStorageProvider],
      useFactory: (
        config: ConfigService,
        local: LocalStorageProvider,
        supabase: SupabaseStorageProvider,
      ): IStorageService => {
        const provider = config.get<string>("STORAGE_PROVIDER") ?? "local";
        const logger = new Logger("StorageModule");
        if (provider === "supabase") {
          logger.log("Using SupabaseStorageProvider");
          return supabase;
        }
        logger.log("Using LocalStorageProvider");
        return local;
      },
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
