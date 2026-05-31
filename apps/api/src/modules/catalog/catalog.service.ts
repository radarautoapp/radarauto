/**
 * CatalogService — vitrine pública de veículos.
 *
 * Lista apenas Listings ACTIVE de TODAS as lojas (não deletados), com:
 *   - filtros (marca, preço, ano, cidade/UF, categoria, km, combustível,
 *     cor, delivery, opcionais, oportunidades, busca textual)
 *   - ordenação: relevance (rankingScore desc), price_asc/desc, recent
 *     (NUNCA só created_at — recent ainda desempata por rankingScore)
 *   - paginação enumerada (default 40/página)
 *   - facetas (marcas com contagem, categorias, cidades, cores, etc.)
 *   - oportunidades (15%+ abaixo da FIPE), independentes da página
 *
 * É só leitura/descoberta — nenhuma gestão acontece aqui.
 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type { CatalogItem, CatalogResponse, CatalogSort } from "@radar/types";

import { PrismaService } from "../../prisma/prisma.service";
import { CatalogQueryDto } from "./dto/catalog-query.dto";

const DEFAULT_PAGE_SIZE = 40;
const MAX_PAGE_SIZE = 60;
/** Oportunidade = preço 20%+ abaixo da FIPE (diff <= -20). */
const OPPORTUNITY_DIFF = -20;
/** Strip de oportunidades no topo: 15%+ abaixo. */
const OPP_STRIP_DIFF = -15;
const OPP_STRIP_LIMIT = 8;

/** Campos do Vehicle + listing necessários para montar o card. */
const vehicleSelect = {
  id: true,
  brand: true,
  model: true,
  version: true,
  year: true,
  km: true,
  fuel: true,
  color: true,
  colorHex: true,
  category: true,
  city: true,
  state: true,
  price: true,
  fipe: true,
  delivery: true,
  photos: true,
  optionals: true,
  storeId: true,
  store: { select: { name: true } },
  listing: { select: { rankingScore: true, views: true } },
} satisfies Prisma.VehicleSelect;

type VehicleRow = Prisma.VehicleGetPayload<{ select: typeof vehicleSelect }>;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: CatalogQueryDto): Promise<CatalogResponse> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = Math.min(
      query.pageSize && query.pageSize > 0 ? query.pageSize : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );

    const where = this.buildWhere(query);

    // Busca o conjunto filtrado (sem paginar) para: contagem real pós-filtro
    // de opcionais/oportunidade, facetas e strip de oportunidades.
    // O volume do catálogo nesta fase é pequeno; quando crescer, migramos
    // contagem/facetas para queries agregadas dedicadas.
    const all = await this.prisma.vehicle.findMany({
      where,
      select: vehicleSelect,
    });

    // Filtros que dependem de cálculo derivado (diff) ou de array (opcionais)
    // são aplicados em memória sobre o conjunto já reduzido pelo banco.
    const filtered = all.filter((v) => {
      const diff = this.calcDiff(v.price, v.fipe);
      if (query.opportunitiesOnly && diff > OPPORTUNITY_DIFF) return false;
      if (query.optionals && query.optionals.length > 0) {
        const set = new Set(v.optionals.map((o) => o.toLowerCase()));
        const hasAll = query.optionals.every((o) => set.has(o.toLowerCase()));
        if (!hasAll) return false;
      }
      return true;
    });

    const sorted = this.sortRows(filtered, query.sort);
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const pageRows = sorted.slice(start, start + pageSize);

    const items = pageRows.map((v) => this.toItem(v));

    const opportunities = sorted
      .filter((v) => this.calcDiff(v.price, v.fipe) <= OPP_STRIP_DIFF)
      .sort((a, b) => this.calcDiff(a.price, a.fipe) - this.calcDiff(b.price, b.fipe))
      .slice(0, OPP_STRIP_LIMIT)
      .map((v) => this.toItem(v));

    const facets = this.buildFacets(all);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
      facets,
      opportunities,
    };
  }

  /** WHERE do Prisma: só ACTIVE de todas as lojas + filtros diretos. */
  private buildWhere(query: CatalogQueryDto): Prisma.VehicleWhereInput {
    const and: Prisma.VehicleWhereInput[] = [
      { deletedAt: null },
      { listing: { is: { status: "ACTIVE" } } },
    ];

    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      and.push({
        OR: [
          { brand: { contains: q, mode: "insensitive" } },
          { model: { contains: q, mode: "insensitive" } },
          { version: { contains: q, mode: "insensitive" } },
        ],
      });
    }
    if (query.brand) and.push({ brand: { equals: query.brand, mode: "insensitive" } });
    if (query.category) and.push({ category: { equals: query.category, mode: "insensitive" } });
    if (query.city) and.push({ city: { equals: query.city, mode: "insensitive" } });
    if (query.state) and.push({ state: { equals: query.state, mode: "insensitive" } });
    if (query.fuel) and.push({ fuel: { equals: query.fuel, mode: "insensitive" } });
    if (query.color) and.push({ color: { equals: query.color, mode: "insensitive" } });
    if (query.delivery !== undefined) and.push({ delivery: query.delivery });
    if (query.priceMin !== undefined) and.push({ price: { gte: query.priceMin } });
    if (query.priceMax !== undefined) and.push({ price: { lte: query.priceMax } });
    if (query.yearMin !== undefined) and.push({ year: { gte: query.yearMin } });
    if (query.yearMax !== undefined) and.push({ year: { lte: query.yearMax } });
    if (query.kmMax !== undefined) and.push({ km: { lte: query.kmMax } });

    return { AND: and };
  }

  /** Ordenação em memória (espelha buildOrderBy) — necessária por causa do diff. */
  private sortRows(rows: VehicleRow[], sort?: CatalogSort): VehicleRow[] {
    const score = (v: VehicleRow) => v.listing?.rankingScore ?? 0;
    const cmp: Record<CatalogSort, (a: VehicleRow, b: VehicleRow) => number> = {
      price_asc: (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      recent: (a, b) => score(b) - score(a),
      relevance: (a, b) => score(b) - score(a),
    };
    const fn = cmp[sort ?? "relevance"] ?? cmp.relevance;
    return [...rows].sort(fn);
  }

  /** Facetas a partir do conjunto filtrado pelo banco (antes de opcionais/opp). */
  private buildFacets(rows: VehicleRow[]): CatalogResponse["facets"] {
    const brandCount = new Map<string, number>();
    const categories = new Set<string>();
    const fuels = new Set<string>();
    const cities = new Set<string>();
    const colors = new Map<string, string | null>();
    const optionals = new Set<string>();

    for (const v of rows) {
      brandCount.set(v.brand, (brandCount.get(v.brand) ?? 0) + 1);
      if (v.category) categories.add(v.category);
      if (v.fuel) fuels.add(v.fuel);
      if (v.city) cities.add(v.city);
      if (v.color && !colors.has(v.color)) colors.set(v.color, v.colorHex);
      for (const o of v.optionals) optionals.add(o);
    }

    return {
      brands: [...brandCount.entries()]
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => a.brand.localeCompare(b.brand)),
      categories: [...categories].sort(),
      fuels: [...fuels].sort(),
      cities: [...cities].sort(),
      colors: [...colors.entries()].map(([name, hex]) => ({ name, hex })),
      optionals: [...optionals].sort(),
    };
  }

  /** Diferença % vs FIPE. Negativo = abaixo da FIPE. Arredondado. */
  private calcDiff(price: number, fipe: number): number {
    if (!fipe || fipe <= 0) return 0;
    return Math.round(((price - fipe) / fipe) * 100);
  }

  private toItem(v: VehicleRow): CatalogItem {
    return {
      id: v.id,
      brand: v.brand,
      model: v.model,
      version: v.version,
      year: v.year,
      km: v.km,
      fuel: v.fuel,
      color: v.color,
      colorHex: v.colorHex,
      category: v.category,
      city: v.city,
      state: v.state,
      price: v.price,
      fipe: v.fipe,
      diff: this.calcDiff(v.price, v.fipe),
      delivery: v.delivery,
      coverPhoto: v.photos[0] ?? null,
      photoCount: v.photos.length,
      rankingScore: v.listing?.rankingScore ?? 0,
      views: v.listing?.views ?? 0,
      storeId: v.storeId,
      storeName: v.store?.name ?? "",
    };
  }
}
