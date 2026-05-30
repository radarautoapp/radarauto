/**
 * BrandsService
 *
 * Lê marcas do nosso banco (populado via seed:brands).
 * Rápido — não depende da FIPE em runtime pra listar.
 */
import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll() {
    return this.prisma.brand.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        fipeCode: true,
        name: true,
        slug: true,
        logoUrl: true,
        logoFormat: true,
        popular: true,
        order: true,
      },
    });
  }
}
