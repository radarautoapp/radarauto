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
import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { computeFeedScore } from "../../common/feed-score";

import type {
  CatalogItem,
  CatalogResponse,
  CatalogSort,
  SimilarVehicle,
  VehicleDetail,
  VehicleDetailResponse,
} from "@radar/types";

import { SafeUser } from "../auth/auth.service";

import { PrismaService } from "../../prisma/prisma.service";
import { CatalogQueryDto } from "./dto/catalog-query.dto";

const DEFAULT_PAGE_SIZE = 40;
const MAX_PAGE_SIZE = 60;
/** Oportunidade = preço 20%+ abaixo da FIPE (diff <= -20). */
const OPPORTUNITY_DIFF = -20;
/** Strip de oportunidades no topo: 15%+ abaixo. */
const OPP_STRIP_DIFF = -15;
const OPP_STRIP_LIMIT = 8;
/** Quantos cards o plano free vê nítidos no catálogo. */
const FREE_CATALOG_LIMIT = 3;
/** Fotos visíveis no plano free (galeria limitada). */
const FREE_PHOTO_LIMIT = 3;

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
  createdAt: true,
  listing: { select: { rankingScore: true, views: true, publishedAt: true } },
} satisfies Prisma.VehicleSelect;

type VehicleRow = Prisma.VehicleGetPayload<{ select: typeof vehicleSelect }>;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: SafeUser, query: CatalogQueryDto): Promise<CatalogResponse> {
    const premium = user.plan === "premium";
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

    // Free sempre ordena por Radar Score (os 3 melhores ficam nítidos).
    const sorted = this.sortRows(filtered, premium ? query.sort : "relevance");
    const total = sorted.length;
    // Free não tem paginação: vê só a 1ª página (3 nítidos + resto borrado).
    const effectivePage = premium ? page : 1;
    const totalPages = premium ? Math.max(1, Math.ceil(total / pageSize)) : 1;
    const start = (effectivePage - 1) * pageSize;
    const pageRows = sorted.slice(start, start + pageSize);

    // No free, os primeiros FREE_CATALOG_LIMIT ficam liberados; o resto bloqueado.
    const items = pageRows.map((v, idx) => {
      const locked = !premium && idx >= FREE_CATALOG_LIMIT;
      return this.toItem(v, locked);
    });

    const opportunities = sorted
      .filter((v) => this.calcDiff(v.price, v.fipe) <= OPP_STRIP_DIFF)
      .sort((a, b) => this.calcDiff(a.price, a.fipe) - this.calcDiff(b.price, b.fipe))
      .slice(0, OPP_STRIP_LIMIT)
      .map((v) => this.toItem(v, false));

    const facets = this.buildFacets(all);

    const lockedCount = items.filter((it) => it.locked).length;

    return {
      items,
      total,
      page: effectivePage,
      pageSize,
      totalPages,
      premium,
      lockedCount,
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
    const now = new Date();
    // Relevância democrática: recência domina, Radar Score modula.
    const feed = (v: VehicleRow) =>
      computeFeedScore({
        rankingScore: v.listing?.rankingScore ?? 0,
        publishedAt: v.listing?.publishedAt ?? null,
        createdAt: v.createdAt,
        now,
      });
    // Data de publicação efetiva (cai para createdAt quando ausente).
    const publishedAt = (v: VehicleRow) => (v.listing?.publishedAt ?? v.createdAt).getTime();
    const cmp: Record<CatalogSort, (a: VehicleRow, b: VehicleRow) => number> = {
      price_asc: (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      recent: (a, b) => publishedAt(b) - publishedAt(a),
      relevance: (a, b) => feed(b) - feed(a),
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

  /**
   * Detalhe público de um veículo (ACTIVE). Condiciona dados ao plano:
   * FREE recebe galeria limitada e sem vendedor/insights; premium recebe tudo.
   * Incrementa o contador de views (best-effort).
   */
  async detail(user: SafeUser, id: string): Promise<VehicleDetailResponse> {
    const v = await this.prisma.vehicle.findFirst({
      where: { id, deletedAt: null, listing: { is: { status: "ACTIVE" } } },
      select: {
        id: true,
        brand: true,
        model: true,
        version: true,
        year: true,
        yearModel: true,
        km: true,
        fuel: true,
        transm: true,
        color: true,
        colorHex: true,
        plate: true,
        category: true,
        price: true,
        fipe: true,
        city: true,
        state: true,
        optionals: true,
        obs: true,
        photos: true,
        delivery: true,
        storeId: true,
        store: {
          select: {
            name: true,
            initials: true,
            phone: true,
            whatsapp: true,
            city: true,
            state: true,
            since: true,
            rating: true,
            reviews: true,
            verified: true,
            logoUrl: true,
          },
        },
        listing: { select: { status: true, rankingScore: true, views: true } },
      },
    });

    if (!v) {
      throw new NotFoundException({
        code: "VEHICLE_NOT_FOUND",
        message: "Veículo não encontrado ou indisponível.",
      });
    }

    const premium = user.plan === "premium";

    // Incrementa views (best-effort, não bloqueia a resposta).
    this.prisma.listing
      .update({ where: { vehicleId: id }, data: { views: { increment: 1 } } })
      .catch(() => undefined);

    // Galeria: FREE recebe só as primeiras N fotos; premium recebe todas.
    const photoCount = v.photos.length;
    const photos = premium ? v.photos : v.photos.slice(0, FREE_PHOTO_LIMIT);

    // Similares: outros ACTIVE, ordenados por maior desconto (diff asc).
    const similarRows = await this.prisma.vehicle.findMany({
      where: {
        id: { not: id },
        deletedAt: null,
        listing: { is: { status: "ACTIVE" } },
      },
      select: {
        id: true,
        brand: true,
        model: true,
        version: true,
        year: true,
        km: true,
        price: true,
        fipe: true,
        city: true,
        state: true,
        photos: true,
      },
      take: 24,
    });

    const similarFull = similarRows
      .map((s) => ({
        id: s.id,
        brand: s.brand,
        model: s.model,
        version: s.version,
        year: s.year,
        km: s.km,
        price: s.price,
        fipe: s.fipe,
        diff: this.calcDiff(s.price, s.fipe),
        city: s.city,
        state: s.state,
        coverPhoto: s.photos[0] ?? null,
      }))
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 4);

    // No free, os similares ficam bloqueados (gancho de upgrade): mandamos só
    // a foto (borrada no front) e nada de id/preço/marca reais.
    const similar: SimilarVehicle[] = similarFull.map((s) =>
      premium
        ? { ...s, locked: false }
        : {
            id: "",
            brand: "",
            model: "",
            version: "",
            year: 0,
            km: 0,
            price: 0,
            fipe: 0,
            diff: 0,
            city: "",
            state: "",
            coverPhoto: s.coverPhoto,
            locked: true,
          },
    );

    const detail: VehicleDetail = {
      id: v.id,
      storeId: v.storeId,
      brand: v.brand,
      model: v.model,
      version: v.version,
      year: v.year,
      yearModel: v.yearModel,
      km: v.km,
      fuel: v.fuel,
      transm: v.transm,
      color: v.color,
      colorHex: v.colorHex,
      plate: v.plate,
      category: v.category,
      price: v.price,
      fipe: v.fipe,
      diff: this.calcDiff(v.price, v.fipe),
      city: v.city,
      state: v.state,
      optionals: v.optionals,
      obs: v.obs,
      delivery: v.delivery,
      status: v.listing?.status ?? "ACTIVE",
      photos,
      photoCount,
      premium,
      freePhotoLimit: FREE_PHOTO_LIMIT,
      seller: premium
        ? {
            name: v.store?.name ?? "",
            initials: v.store?.initials ?? "",
            city: v.store?.city ?? "",
            state: v.store?.state ?? "",
            phone: v.store?.phone ?? "",
            whatsapp: v.store?.whatsapp ?? null,
            since: v.store?.since ?? 0,
            rating: v.store?.rating ?? 0,
            reviews: v.store?.reviews ?? 0,
            verified: v.store?.verified ?? false,
            logoUrl: v.store?.logoUrl ?? null,
          }
        : null,
      insights: premium
        ? {
            views: v.listing?.views ?? 0,
            rankingScore: v.listing?.rankingScore ?? 0,
          }
        : null,
      similar,
    };

    return { vehicle: detail };
  }

  private toItem(v: VehicleRow, locked = false): CatalogItem {
    // Card bloqueado (free): não enviamos dados sensíveis reais — o blur é UX,
    // mas os dados nem saem do backend (regra de ouro do paywall).
    if (locked) {
      return {
        id: "",
        brand: "",
        model: "",
        version: "",
        year: 0,
        km: 0,
        fuel: "",
        color: "",
        colorHex: null,
        category: "",
        city: "",
        state: "",
        price: 0,
        fipe: 0,
        diff: 0,
        delivery: false,
        coverPhoto: v.photos[0] ?? null,
        photoCount: v.photos.length,
        rankingScore: 0,
        views: 0,
        storeId: "",
        storeName: "",
        locked: true,
      };
    }
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
      locked: false,
    };
  }
}
