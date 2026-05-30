/**
 * ParallelumFipeProvider (fallback)
 *
 * API: https://parallelum.com.br/fipe/api/v2/carros/...
 *   GET /marcas
 *   GET /marcas/{brandCode}/modelos
 *   GET /marcas/{brandCode}/modelos/{modelCode}/anos
 *   GET /marcas/{brandCode}/modelos/{modelCode}/anos/{yearCode}
 */
import { HttpException, Injectable } from "@nestjs/common";

import type { FipeBrand, FipeModel, FipePrice, FipeYear } from "@radar/types";

import { IFipeProvider } from "../fipe.interface";

const BASE = "https://parallelum.com.br/fipe/api/v2/carros";
const TIMEOUT_MS = 8000;

interface PxBrandModel {
  code: string;
  name: string;
}
interface PxPrice {
  price: string;
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
  codeFipe: string;
  referenceMonth: string;
}

@Injectable()
export class ParallelumFipeProvider implements IFipeProvider {
  readonly name = "parallelum";

  async listBrands(): Promise<FipeBrand[]> {
    const data = await this.fetch<PxBrandModel[]>(`${BASE}/marcas`);
    return data.map((b) => ({ code: b.code, name: b.name }));
  }

  async listModels(brandCode: string): Promise<FipeModel[]> {
    const data = await this.fetch<PxBrandModel[]>(`${BASE}/marcas/${brandCode}/modelos`);
    return data.map((m) => ({ code: m.code, name: m.name }));
  }

  async listYears(brandCode: string, modelCode: string): Promise<FipeYear[]> {
    const data = await this.fetch<PxBrandModel[]>(
      `${BASE}/marcas/${brandCode}/modelos/${modelCode}/anos`,
    );
    return data.map((y) => ({ code: y.code, name: y.name }));
  }

  async getPrice(brandCode: string, modelCode: string, yearCode: string): Promise<FipePrice> {
    const data = await this.fetch<PxPrice>(
      `${BASE}/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`,
    );
    return {
      priceCents: parseBrlToCents(data.price),
      priceLabel: data.price,
      brand: data.brand,
      model: data.model,
      modelYear: data.modelYear,
      fuel: data.fuel,
      fipeCode: data.codeFipe,
      referenceMonth: data.referenceMonth,
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
  const digits = brl.replace(/[^\d,]/g, "").replace(",", ".");
  const value = parseFloat(digits);
  return Math.round((Number.isFinite(value) ? value : 0) * 100);
}
