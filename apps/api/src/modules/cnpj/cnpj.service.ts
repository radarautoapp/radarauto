/**
 * CnpjService
 *
 * Orquestra consulta de CNPJ:
 *   1. Valida formato + dígito verificador (Regra 9)
 *   2. Verifica cache (TTL 1h) — economiza chamadas externas
 *   3. Tenta BrasilAPI (primário)
 *   4. Em caso de falha (rate limit / indisponível): fallback ReceitaWS
 *   5. Cacheia resultado positivo
 *
 * Erros padronizados (Regra 28):
 *   INVALID_CNPJ_FORMAT — falhou validação local
 *   CNPJ_NOT_FOUND — nenhum provider achou
 *   CNPJ_LOOKUP_UNAVAILABLE — todos providers indisponíveis
 */
import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { CnpjLookupResponse } from "@radar/types";

import {
  CnpjNotFoundError,
  CnpjProvider,
  ProviderRateLimitError,
  ProviderUnavailableError,
} from "./providers/cnpj-provider.interface";
import { BrasilApiProvider } from "./providers/brasilapi.provider";
import { ReceitaWsProvider } from "./providers/receitaws.provider";
import { CnpjValidator } from "./cnpj.validator";

interface CacheEntry {
  data: CnpjLookupResponse;
  expiresAt: number;
}

@Injectable()
export class CnpjService {
  private readonly logger = new Logger(CnpjService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTtlMs = 60 * 60 * 1000;
  private readonly maxCacheSize = 1000;

  private readonly providers: CnpjProvider[];

  constructor(
    private readonly brasilApi: BrasilApiProvider,
    private readonly receitaWs: ReceitaWsProvider,
  ) {
    this.providers = [this.brasilApi, this.receitaWs];
  }

  async lookup(rawCnpj: string): Promise<CnpjLookupResponse> {
    const cnpj = CnpjValidator.normalize(rawCnpj);

    if (!CnpjValidator.isValid(cnpj)) {
      throw new BadRequestException({
        code: "INVALID_CNPJ_FORMAT",
        message: "CNPJ inválido. Verifique os dígitos.",
      });
    }

    const cached = this.readCache(cnpj);
    if (cached) {
      return { ...cached, source: "cache" };
    }

    let lastError: HttpException | null = null;

    for (const provider of this.providers) {
      try {
        const data = await provider.fetch(cnpj);
        this.writeCache(cnpj, data);
        return data;
      } catch (err) {
        if (err instanceof CnpjNotFoundError) {
          throw new NotFoundException({
            code: "CNPJ_NOT_FOUND",
            message: "CNPJ não encontrado na Receita Federal.",
          });
        }
        if (err instanceof ProviderRateLimitError || err instanceof ProviderUnavailableError) {
          this.logger.warn({
            msg: "Provider falhou, tentando fallback",
            provider: provider.name,
            error: err.code,
          });
          lastError = new ServiceUnavailableException({
            code: "CNPJ_LOOKUP_UNAVAILABLE",
            message: "Não foi possível consultar o CNPJ no momento. Tente novamente em instantes.",
          });
          continue;
        }
        this.logger.error({ msg: "Erro inesperado em provider", error: String(err) });
        lastError = new ServiceUnavailableException({
          code: "CNPJ_LOOKUP_UNAVAILABLE",
          message: "Não foi possível consultar o CNPJ no momento.",
        });
      }
    }

    throw (
      lastError ??
      new ServiceUnavailableException({
        code: "CNPJ_LOOKUP_UNAVAILABLE",
        message: "Não foi possível consultar o CNPJ no momento.",
      })
    );
  }

  private readCache(cnpj: string): CnpjLookupResponse | null {
    const entry = this.cache.get(cnpj);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(cnpj);
      return null;
    }
    return entry.data;
  }

  private writeCache(cnpj: string, data: CnpjLookupResponse): void {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(cnpj, { data, expiresAt: Date.now() + this.cacheTtlMs });
  }
}
