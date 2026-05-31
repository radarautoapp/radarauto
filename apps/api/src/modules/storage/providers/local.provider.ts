/**
 * LocalStorageProvider
 *
 * Salva arquivos em disco local (apps/api/uploads/).
 * Serve via rota estática /uploads/* configurada no main.ts.
 *
 * Usado em desenvolvimento. NÃO usar em produção (containers stateless).
 *
 * Bucket opcional (opts.bucket) vira um subdiretório: uploads/{bucket}/{key}.
 * Mantém paridade com o SupabaseStorageProvider.
 */
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdir, unlink, writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";

import { IStorageService, UploadOptions, UploadResult } from "../storage.interface";

@Injectable()
export class LocalStorageProvider implements IStorageService {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly rootDir: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.rootDir = resolve(this.config.get<string>("LOCAL_STORAGE_ROOT") ?? "uploads");
    const apiBaseUrl = this.config.get<string>("API_BASE_URL") ?? "http://localhost:3001";
    this.publicBaseUrl = `${apiBaseUrl}/uploads`;
  }

  /** Combina bucket + key num path relativo (bucket vira subpasta). */
  private relPath(key: string, bucket?: string): string {
    return bucket ? `${bucket}/${key}` : key;
  }

  async upload(opts: UploadOptions): Promise<UploadResult> {
    const rel = this.relPath(opts.key, opts.bucket);
    const fullPath = join(this.rootDir, rel);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, opts.buffer);
    const url = `${this.publicBaseUrl}/${rel}`;
    this.logger.debug({ msg: "storage.local.upload", key: rel, size: opts.buffer.length });
    return { url, key: opts.key };
  }

  async delete(key: string, bucket?: string): Promise<void> {
    const rel = this.relPath(key, bucket);
    const fullPath = join(this.rootDir, rel);
    try {
      await unlink(fullPath);
      this.logger.debug({ msg: "storage.local.delete", key: rel });
    } catch (err) {
      // Arquivo já não existe — OK
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        this.logger.warn({ msg: "storage.local.delete.failed", key: rel, error: String(err) });
      }
    }
  }

  extractKey(url: string): string | null {
    if (!url.startsWith(this.publicBaseUrl)) return null;
    return url.slice(this.publicBaseUrl.length + 1); // +1 pra remover a /
  }
}
