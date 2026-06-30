/**
 * BrasilApiProvider
 *
 * Consulta CNPJ via https://brasilapi.com.br/api/cnpj/v1/{cnpj}
 * - Gratuita, sem chave, sem cadastro.
 * - Rate limit ~3 req/s por IP.
 * - Timeout configurável (default 5s).
 *
 * Normaliza a resposta pra CnpjLookupResponse incluindo QSA (sócios).
 */
import { Injectable, Logger } from "@nestjs/common";
import type { CnpjLookupResponse, CnpjPartner, CnpjStatus } from "@radar/types";

import {
  CnpjNotFoundError,
  CnpjProvider,
  ProviderRateLimitError,
  ProviderUnavailableError,
} from "./cnpj-provider.interface";

interface BrasilApiQsaItem {
  nome_socio: string;
  qualificacao_socio: string | null;
}

interface BrasilApiPayload {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  descricao_situacao_cadastral: string;
  descricao_motivo_situacao_cadastral: string | null;
  data_inicio_atividade: string | null;
  ddd_telefone_1: string | null;
  email: string | null;
  municipio: string;
  uf: string;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cnae_fiscal: number | null;
  cnae_fiscal_descricao: string | null;
  cnaes_secundarios: Array<{ codigo: number; descricao: string }> | null;
  qsa: BrasilApiQsaItem[] | null;
}

@Injectable()
export class BrasilApiProvider implements CnpjProvider {
  readonly name = "brasilapi" as const;
  private readonly logger = new Logger(BrasilApiProvider.name);
  private readonly baseUrl = "https://brasilapi.com.br/api/cnpj/v1";
  private readonly timeoutMs = 5000;

  async fetch(cnpj: string): Promise<CnpjLookupResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/${cnpj}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (res.status === 404) throw new CnpjNotFoundError(cnpj);
      if (res.status === 429) throw new ProviderRateLimitError(this.name);
      if (!res.ok) throw new ProviderUnavailableError(this.name, `HTTP ${res.status}`);

      const payload = (await res.json()) as BrasilApiPayload;
      return this.normalize(payload);
    } catch (err) {
      if (
        err instanceof CnpjNotFoundError ||
        err instanceof ProviderRateLimitError ||
        err instanceof ProviderUnavailableError
      ) {
        throw err;
      }
      if (err instanceof Error && err.name === "AbortError") {
        throw new ProviderUnavailableError(this.name, "timeout");
      }
      this.logger.warn({ msg: "BrasilAPI unexpected error", error: String(err) });
      throw new ProviderUnavailableError(this.name, err);
    } finally {
      clearTimeout(timer);
    }
  }

  private normalize(p: BrasilApiPayload): CnpjLookupResponse {
    const statusMap: Record<string, CnpjStatus> = {
      ATIVA: "ATIVA",
      BAIXADA: "BAIXADA",
      SUSPENSA: "SUSPENSA",
      INAPTA: "INAPTA",
      NULA: "NULA",
    };
    const partners: CnpjPartner[] = (p.qsa ?? [])
      .filter((q) => q.nome_socio)
      .map((q) => ({
        name: q.nome_socio.trim(),
        role: q.qualificacao_socio?.trim() ?? null,
      }));
    return {
      cnpj: p.cnpj,
      legalName: p.razao_social,
      tradeName: p.nome_fantasia,
      status: statusMap[p.descricao_situacao_cadastral?.toUpperCase()] ?? "DESCONHECIDA",
      statusReason: p.descricao_motivo_situacao_cadastral,
      openedAt: p.data_inicio_atividade,
      phone: p.ddd_telefone_1,
      email: p.email,
      city: p.municipio,
      state: p.uf,
      zip: p.cep,
      street: p.logradouro,
      number: p.numero,
      neighborhood: p.bairro,
      mainActivityCode: p.cnae_fiscal ? String(p.cnae_fiscal) : null,
      mainActivityName: p.cnae_fiscal_descricao,
      secondaryActivityCodes: (p.cnaes_secundarios ?? [])
        .map((c) => (c.codigo ? String(c.codigo) : null))
        .filter((c): c is string => !!c),
      partners,
      source: "brasilapi",
      fetchedAt: new Date().toISOString(),
    };
  }
}
