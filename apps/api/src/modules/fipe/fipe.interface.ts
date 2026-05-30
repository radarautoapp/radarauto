/**
 * IFipeProvider
 *
 * Strategy pra consulta FIPE. Implementações:
 *  - BrasilApiFipeProvider (primary)
 *  - ParallelumFipeProvider (fallback)
 *
 * Tudo normalizado pros tipos de @radar/types.
 */
import type { FipeBrand, FipeModel, FipePrice, FipeYear } from "@radar/types";

export interface IFipeProvider {
  readonly name: string;
  listBrands(): Promise<FipeBrand[]>;
  listModels(brandCode: string): Promise<FipeModel[]>;
  listYears(brandCode: string, modelCode: string): Promise<FipeYear[]>;
  getPrice(brandCode: string, modelCode: string, yearCode: string): Promise<FipePrice>;
}

export const FIPE_PROVIDERS = Symbol("FIPE_PROVIDERS");
