/**
 * ParallelumFipeProvider (fallback)
 *
 * API v1: https://parallelum.com.br/fipe/api/v1/carros/...
 *   GET /marcas                                       → [{codigo, nome}]
 *   GET /marcas/{brand}/modelos                       → {modelos:[{codigo,nome}], anos:[]}
 *   GET /marcas/{brand}/modelos/{model}/anos          → [{codigo, nome}]
 *   GET /marcas/{brand}/modelos/{model}/anos/{year}   → {Valor, Marca, ...}
 *
 * Atenção: Parallelum tem rate limit / cobrança no uso intenso.
 * É só fallback — BrasilAPI é primary. Cache no service minimiza chamadas.
 */
import { HttpException, Injectable } from "@nestjs/common";

import type { FipeBrand, FipeModel, FipePrice, FipeYear } from "@radar/types";

import { IFipeProvider } from "../fipe.interface";

const BASE = "https://parallelum.com.br/fipe/api/v1/carros";
const TIMEOUT_MS = 8000;

interface PxCodNome {
  codigo: string | number;
  nome: string;
}
interface PxModelsResponse {
  modelos: PxCodNome[];
  anos: PxCodNome[];
}
interface PxPrice {
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
}

@Injectable()
export class ParallelumFipeProvider implements IFipeProvider {
  readonly name = "parallelum";

  async listBrands(): Promise<FipeBrand[]> {
    const data = await this.fetch<PxCodNome[]>(`${BASE}/marcas`);
    return data.map((b) => ({ code: String(b.codigo), name: b.nome }));
  }

  async listModels(brandCode: string): Promise<FipeModel[]> {
    const data = await this.fetch<PxModelsResponse>(`${BASE}/marcas/${brandCode}/modelos`);
    return data.modelos.map((m) => ({ code: String(m.codigo), name: m.nome }));
  }

  async listYears(brandCode: string, modelCode: string): Promise<FipeYear[]> {
    const data = await this.fetch<PxCodNome[]>(
      `${BASE}/marcas/${brandCode}/modelos/${modelCode}/anos`,
    );
    return data.map((y) => ({ code: String(y.codigo), name: y.nome }));
  }

  async getPrice(brandCode: string, modelCode: string, yearCode: string): Promise<FipePrice> {
    const data = await this.fetch<PxPrice>(
      `${BASE}/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`,
    );
    return {
      priceCents: parseBrlToCents(data.Valor),
      priceLabel: data.Valor,
      brand: data.Marca,
      model: data.Modelo,
      modelYear: data.AnoModelo,
      fuel: data.Combustivel,
      fipeCode: data.CodigoFipe,
      referenceMonth: data.MesReferencia,
    };
  }

  private async fetch<T>(url: string): Promise<T> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        throw new HttpException(
          { code: "FIPE_PROVIDER_ERROR", message: `Parallelum status ${res.status}` },
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
  const cleaned = brl
    .replace(/[^\d,]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const value = parseFloat(cleaned);
  return Math.round((Number.isFinite(value) ? value : 0) * 100);
}
