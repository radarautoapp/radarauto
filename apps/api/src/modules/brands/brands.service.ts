/**
 * BrandsService
 *
 * Lê marcas do nosso banco (populado via seed:brands).
 * Rápido — não depende da FIPE em runtime pra listar.
 *
 * - listWithLogo(): só marcas com logo (default do grid, mais limpo)
 * - search(q): busca em TODAS as marcas (inclui as sem logo, pra casos raros)
 */
import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

const BRAND_SELECT = {
  id: true,
  fipeCode: true,
  name: true,
  slug: true,
  logoUrl: true,
  logoFormat: true,
  popular: true,
  order: true,
} as const;

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Só marcas com logo — usado no grid do wizard. */
  async listWithLogo() {
    return this.prisma.brand.findMany({
      where: { logoUrl: { not: null } },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: BRAND_SELECT,
    });
  }

  /** Busca em todas as marcas (com ou sem logo). */
  async search(q: string) {
    const term = q.trim();
    if (!term) return this.listWithLogo();
    return this.prisma.brand.findMany({
      where: { name: { contains: term, mode: "insensitive" } },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: BRAND_SELECT,
    });
  }
}
