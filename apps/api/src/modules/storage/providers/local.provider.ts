/**
 * LocalStorageProvider
 *
 * Salva arquivos em disco local (apps/api/uploads/).
 * Serve via rota estática /uploads/* configurada no main.ts.
 *
 * Usado em desenvolvimento. NÃO usar em produção (containers stateless).
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

  async upload(opts: UploadOptions): Promise<UploadResult> {
    const fullPath = join(this.rootDir, opts.key);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, opts.buffer);
    const url = `${this.publicBaseUrl}/${opts.key}`;
    this.logger.debug({ msg: "storage.local.upload", key: opts.key, size: opts.buffer.length });
    return { url, key: opts.key };
  }

  async delete(key: string): Promise<void> {
    const fullPath = join(this.rootDir, key);
    try {
      await unlink(fullPath);
      this.logger.debug({ msg: "storage.local.delete", key });
    } catch (err) {
      // Arquivo já não existe — OK
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        this.logger.warn({ msg: "storage.local.delete.failed", key, error: String(err) });
      }
    }
  }

  extractKey(url: string): string | null {
    if (!url.startsWith(this.publicBaseUrl)) return null;
    return url.slice(this.publicBaseUrl.length + 1); // +1 pra remover a /
  }
}
