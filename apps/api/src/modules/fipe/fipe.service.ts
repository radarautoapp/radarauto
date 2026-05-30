/**
 * FipeService
 *
 * Orquestra os providers com fallback: tenta BrasilAPI primeiro,
 * se falhar cai pra Parallelum. Cache em memória (TTL) pra reduzir
 * chamadas externas (marcas/modelos mudam raramente).
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import type { FipeBrand, FipeModel, FipePrice, FipeYear } from "@radar/types";

import { FIPE_PROVIDERS, IFipeProvider } from "./fipe.interface";

const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12h

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class FipeService {
  private readonly logger = new Logger(FipeService.name);
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  constructor(@Inject(FIPE_PROVIDERS) private readonly providers: IFipeProvider[]) {}

  async listBrands(): Promise<FipeBrand[]> {
    return this.cached("brands", () => this.withFallback((p) => p.listBrands()));
  }

  async listModels(brandCode: string): Promise<FipeModel[]> {
    return this.cached(`models:${brandCode}`, () =>
      this.withFallback((p) => p.listModels(brandCode)),
    );
  }

  async listYears(brandCode: string, modelCode: string): Promise<FipeYear[]> {
    return this.cached(`years:${brandCode}:${modelCode}`, () =>
      this.withFallback((p) => p.listYears(brandCode, modelCode)),
    );
  }

  async getPrice(brandCode: string, modelCode: string, yearCode: string): Promise<FipePrice> {
    // Preço não cacheia (pode variar por mês de referência)
    return this.withFallback((p) => p.getPrice(brandCode, modelCode, yearCode));
  }

  private async withFallback<T>(fn: (provider: IFipeProvider) => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (const provider of this.providers) {
      try {
        return await fn(provider);
      } catch (err) {
        lastError = err;
        this.logger.warn({
          msg: "fipe.provider.failed",
          provider: provider.name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    throw lastError ?? new Error("Todos os providers FIPE falharam");
  }

  private async cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.value as T;
    }
    const value = await fn();
    this.cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }
}
