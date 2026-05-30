/**
 * BrasilApiFipeProvider (primary)
 *
 * Endpoints (tipo fixo "carros"):
 *   GET /api/fipe/marcas/v1/carros
 *   GET /api/fipe/veiculos/v1/carros/{brandCode}
 *   GET /api/fipe/veiculos/v1/carros/{brandCode}/{modelCode}   (anos)
 *   GET /api/fipe/preco/v1/{fipeCode}
 *
 * Obs: a BrasilAPI usa o código FIPE diretamente pro preço. Pra manter a
 * interface uniforme (brand/model/year codes), montamos via os steps anteriores.
 */
import { HttpException, Injectable } from "@nestjs/common";

import type { FipeBrand, FipeModel, FipePrice, FipeYear } from "@radar/types";

import { IFipeProvider } from "../fipe.interface";

const BASE = "https://brasilapi.com.br/api/fipe";
const VEHICLE_TYPE = "carros";
const TIMEOUT_MS = 8000;

interface BrasilApiBrand {
  nome: string;
  valor: string;
}
interface BrasilApiModel {
  modelo: string;
  valor: string;
}
interface BrasilApiPrice {
  valor: string;
  marca: string;
  modelo: string;
  anoModelo: number;
  combustivel: string;
  codigoFipe: string;
  mesReferencia: string;
}

@Injectable()
export class BrasilApiFipeProvider implements IFipeProvider {
  readonly name = "brasilapi";

  async listBrands(): Promise<FipeBrand[]> {
    const data = await this.fetch<BrasilApiBrand[]>(`${BASE}/marcas/v1/${VEHICLE_TYPE}`);
    return data.map((b) => ({ code: b.valor, name: b.nome }));
  }

  async listModels(brandCode: string): Promise<FipeModel[]> {
    const data = await this.fetch<BrasilApiModel[]>(
      `${BASE}/veiculos/v1/${VEHICLE_TYPE}/${brandCode}`,
    );
    return data.map((m) => ({ code: m.valor, name: m.modelo }));
  }

  async listYears(brandCode: string, modelCode: string): Promise<FipeYear[]> {
    const data = await this.fetch<BrasilApiModel[]>(
      `${BASE}/veiculos/v1/${VEHICLE_TYPE}/${brandCode}/${modelCode}`,
    );
    return data.map((y) => ({ code: y.valor, name: y.modelo }));
  }

  async getPrice(_brandCode: string, _modelCode: string, yearCode: string): Promise<FipePrice> {
    // Na BrasilAPI o preço final vem pelo código FIPE.
    // O yearCode aqui carrega o codigoFipe quando disponível.
    const data = await this.fetch<BrasilApiPrice[]>(`${BASE}/preco/v1/${yearCode}`);
    const first = data[0];
    if (!first) {
      throw new HttpException(
        { code: "FIPE_PRICE_NOT_FOUND", message: "Preço FIPE não encontrado." },
        404,
      );
    }
    return {
      priceCents: parseBrlToCents(first.valor),
      priceLabel: first.valor,
      brand: first.marca,
      model: first.modelo,
      modelYear: first.anoModelo,
      fuel: first.combustivel,
      fipeCode: first.codigoFipe,
      referenceMonth: first.mesReferencia,
    };
  }

  private async fetch<T>(url: string): Promise<T> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        throw new HttpException(
          { code: "FIPE_PROVIDER_ERROR", message: `BrasilAPI status ${res.status}` },
          502,
        );
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}

function parseBrlToCents(brl: string): number {
  // "R$ 198.000,00" → 19800000
  const digits = brl.replace(/[^\d,]/g, "").replace(",", ".");
  const value = parseFloat(digits);
  return Math.round((Number.isFinite(value) ? value : 0) * 100);
}
