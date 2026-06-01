/**
 * lib/leads-api.ts
 *
 * Tracking de comportamento do interessado para o engine de leads.
 * Todas as chamadas são best-effort: falhas não devem afetar a navegação.
 */
import type { LeadsResponse } from "@radar/types";

import { apiFetch, tokenStorage } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const leadsApi = {
  /** Lista os leads da loja, agrupados por veículo (tela do lojista). */
  async list(): Promise<LeadsResponse> {
    return apiFetch<LeadsResponse>("/leads", { method: "GET" });
  },
  /** Registra uma visita ao anúncio (incrementa cliques + recência). */
  async view(vehicleId: string): Promise<void> {
    try {
      await apiFetch(`/leads/${vehicleId}/view`, { method: "POST" });
    } catch {
      /* best-effort */
    }
  },

  /** Registra clique em contato (sinal forte → HOT). */
  async contact(vehicleId: string, channel: "whatsapp" | "telegram"): Promise<void> {
    try {
      await apiFetch(`/leads/${vehicleId}/contact`, {
        method: "POST",
        body: { channel },
      });
    } catch {
      /* best-effort */
    }
  },

  /**
   * Registra tempo acumulado na tela (segundos). Usa keepalive para garantir
   * a entrega mesmo quando a aba está sendo fechada / a navegação está saindo.
   */
  time(vehicleId: string, seconds: number): void {
    try {
      const token = tokenStorage.get();
      void fetch(`${API_URL}/api/v1/leads/${vehicleId}/time`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ seconds }),
        keepalive: true,
      });
    } catch {
      /* best-effort */
    }
  },
};
