/**
 * SupabaseStorageProvider
 *
 * Salva arquivos no Supabase Storage (bucket público).
 * URL pública vem do próprio Supabase com CDN automático.
 *
 * Usado em produção. Configure via env vars:
 *   SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_STORAGE_BUCKET
 */
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { IStorageService, UploadOptions, UploadResult } from "../storage.interface";

@Injectable()
export class SupabaseStorageProvider implements IStorageService {
  private readonly logger = new Logger(SupabaseStorageProvider.name);
  private readonly client: SupabaseClient;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    const url = this.config.getOrThrow<string>("SUPABASE_URL");
    const secretKey = this.config.getOrThrow<string>("SUPABASE_SECRET_KEY");
    this.bucket = this.config.get<string>("SUPABASE_STORAGE_BUCKET") ?? "logos";
    this.publicBaseUrl = `${url}/storage/v1/object/public/${this.bucket}`;
    this.client = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async upload(opts: UploadOptions): Promise<UploadResult> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .upload(opts.key, opts.buffer, {
        contentType: opts.contentType ?? "image/webp",
        upsert: true,
        cacheControl: "3600",
      });

    if (error) {
      this.logger.error({
        msg: "storage.supabase.upload.failed",
        key: opts.key,
        error: error.message,
      });
      throw new InternalServerErrorException({
        code: "STORAGE_UPLOAD_FAILED",
        message: "Falha no upload do arquivo.",
      });
    }

    const url = `${this.publicBaseUrl}/${data.path}`;
    this.logger.debug({ msg: "storage.supabase.upload.ok", key: opts.key, url });
    return { url, key: opts.key };
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([key]);
    if (error) {
      // Não-fatal: pode ser que o arquivo já foi removido
      this.logger.warn({ msg: "storage.supabase.delete.failed", key, error: error.message });
      return;
    }
    this.logger.debug({ msg: "storage.supabase.delete.ok", key });
  }

  extractKey(url: string): string | null {
    if (!url.startsWith(this.publicBaseUrl)) return null;
    return url.slice(this.publicBaseUrl.length + 1);
  }
}
