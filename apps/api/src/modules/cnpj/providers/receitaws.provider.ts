/**
 * ReceitaWsProvider
 *
 * Fallback quando BrasilAPI estiver fora do ar ou rate-limited.
 * Endpoint: https://www.receitaws.com.br/v1/cnpj/{cnpj}
 *
 * Rate limit free: 3 req/min por IP — mais agressivo que BrasilAPI,
 * por isso é fallback.
 */
import { Injectable, Logger } from "@nestjs/common";
import type { CnpjLookupResponse, CnpjPartner, CnpjStatus } from "@radar/types";

import {
  CnpjNotFoundError,
  CnpjProvider,
  ProviderRateLimitError,
  ProviderUnavailableError,
} from "./cnpj-provider.interface";

interface ReceitaWsQsaItem {
  nome: string;
  qual: string;
}

interface ReceitaWsPayload {
  status: "OK" | "ERROR";
  message?: string;
  cnpj: string;
  nome: string;
  fantasia: string;
  situacao: string;
  motivo_situacao: string;
  abertura: string;
  telefone: string;
  email: string;
  municipio: string;
  uf: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  atividade_principal: Array<{ code: string; text: string }>;
  atividades_secundarias?: Array<{ code: string; text: string }>;
  qsa: ReceitaWsQsaItem[];
}

@Injectable()
export class ReceitaWsProvider implements CnpjProvider {
  readonly name = "receitaws" as const;
  private readonly logger = new Logger(ReceitaWsProvider.name);
  private readonly baseUrl = "https://www.receitaws.com.br/v1/cnpj";
  private readonly timeoutMs = 5000;

  async fetch(cnpj: string): Promise<CnpjLookupResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/${cnpj}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (res.status === 429) throw new ProviderRateLimitError(this.name);
      if (res.status === 504) throw new ProviderUnavailableError(this.name, "gateway timeout");
      if (!res.ok) throw new ProviderUnavailableError(this.name, `HTTP ${res.status}`);

      const payload = (await res.json()) as ReceitaWsPayload;

      if (payload.status === "ERROR") {
        if (payload.message?.toLowerCase().includes("não existe")) {
          throw new CnpjNotFoundError(cnpj);
        }
        throw new ProviderUnavailableError(this.name, payload.message);
      }

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
      this.logger.warn({ msg: "ReceitaWS unexpected error", error: String(err) });
      throw new ProviderUnavailableError(this.name, err);
    } finally {
      clearTimeout(timer);
    }
  }

  private normalize(p: ReceitaWsPayload): CnpjLookupResponse {
    const statusMap: Record<string, CnpjStatus> = {
      ATIVA: "ATIVA",
      BAIXADA: "BAIXADA",
      SUSPENSA: "SUSPENSA",
      INAPTA: "INAPTA",
      NULA: "NULA",
    };
    const activity = p.atividade_principal?.[0];
    const partners: CnpjPartner[] = (p.qsa ?? [])
      .filter((q) => q.nome)
      .map((q) => ({ name: q.nome.trim(), role: q.qual?.trim() ?? null }));
    return {
      cnpj: p.cnpj?.replace(/\D/g, "") ?? "",
      legalName: p.nome,
      tradeName: p.fantasia || null,
      status: statusMap[p.situacao?.toUpperCase()] ?? "DESCONHECIDA",
      statusReason: p.motivo_situacao || null,
      openedAt: p.abertura || null,
      phone: p.telefone || null,
      email: p.email || null,
      city: p.municipio,
      state: p.uf,
      zip: p.cep || null,
      street: p.logradouro || null,
      number: p.numero || null,
      neighborhood: p.bairro || null,
      mainActivityCode: activity?.code ? activity.code.replace(/\D/g, "") : null,
      secondaryActivityCodes: (p.atividades_secundarias ?? [])
        .map((a) => (a.code ? a.code.replace(/\D/g, "") : null))
        .filter((c): c is string => !!c),
      mainActivityName: activity?.text ?? null,
      partners,
      source: "receitaws",
      fetchedAt: new Date().toISOString(),
    };
  }
}
