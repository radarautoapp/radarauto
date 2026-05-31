/**
 * SupabaseStorageProvider
 *
 * Salva arquivos no Supabase Storage (bucket público).
 * URL pública vem do próprio Supabase com CDN automático.
 *
 * Usado em produção. Configure via env vars:
 *   SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_STORAGE_BUCKET
 *
 * Suporta bucket por upload (opts.bucket) — default = SUPABASE_STORAGE_BUCKET.
 * Cada bucket precisa existir e ser público no Supabase.
 */
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { IStorageService, UploadOptions, UploadResult } from "../storage.interface";

@Injectable()
export class SupabaseStorageProvider implements IStorageService {
  private readonly logger = new Logger(SupabaseStorageProvider.name);
  private readonly client: SupabaseClient;
  private readonly defaultBucket: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    // Lazy: nao explode no boot se STORAGE_PROVIDER=local e vars do Supabase faltarem.
    const url = this.config.get<string>("SUPABASE_URL");
    const secretKey = this.config.get<string>("SUPABASE_SECRET_KEY");
    this.defaultBucket = this.config.get<string>("SUPABASE_STORAGE_BUCKET") ?? "logos";
    this.baseUrl = url ? `${url}/storage/v1/object/public` : "";
    this.client =
      url && secretKey
        ? createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
        : (null as unknown as SupabaseClient);
  }

  private publicUrl(bucket: string, path: string): string {
    return `${this.baseUrl}/${bucket}/${path}`;
  }

  async upload(opts: UploadOptions): Promise<UploadResult> {
    const bucket = opts.bucket ?? this.defaultBucket;
    const { data, error } = await this.client.storage.from(bucket).upload(opts.key, opts.buffer, {
      contentType: opts.contentType ?? "image/webp",
      upsert: true,
      cacheControl: "3600",
    });

    if (error) {
      this.logger.error({
        msg: "storage.supabase.upload.failed",
        bucket,
        key: opts.key,
        error: error.message,
      });
      throw new InternalServerErrorException({
        code: "STORAGE_UPLOAD_FAILED",
        message: "Falha no upload do arquivo.",
      });
    }

    const url = this.publicUrl(bucket, data.path);
    this.logger.debug({ msg: "storage.supabase.upload.ok", bucket, key: opts.key, url });
    return { url, key: opts.key };
  }

  async delete(key: string, bucket?: string): Promise<void> {
    const target = bucket ?? this.defaultBucket;
    const { error } = await this.client.storage.from(target).remove([key]);
    if (error) {
      // Não-fatal: pode ser que o arquivo já foi removido
      this.logger.warn({
        msg: "storage.supabase.delete.failed",
        bucket: target,
        key,
        error: error.message,
      });
      return;
    }
    this.logger.debug({ msg: "storage.supabase.delete.ok", bucket: target, key });
  }

  extractKey(url: string): string | null {
    // baseUrl = .../object/public ; depois vem /{bucket}/{key}
    if (!this.baseUrl || !url.startsWith(this.baseUrl)) return null;
    const rest = url.slice(this.baseUrl.length + 1); // remove "/"
    const slash = rest.indexOf("/");
    if (slash === -1) return null;
    return rest.slice(slash + 1); // tudo depois do bucket
  }
}
