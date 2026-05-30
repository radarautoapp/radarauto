/**
 * LocationsService
 *
 * Estados e cidades do nosso banco (populado via seed:locations, fonte IBGE).
 */
import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listStates() {
    return this.prisma.state.findMany({
      orderBy: { name: "asc" },
      select: { uf: true, name: true, region: true },
    });
  }

  /**
   * Cidades de um estado. Se q informado, filtra por nome (autocomplete).
   * Limita a 50 resultados pra não estourar (estados grandes têm 600+ cidades).
   */
  async listCities(uf: string, q?: string) {
    const term = (q ?? "").trim();
    return this.prisma.city.findMany({
      where: {
        stateUf: uf.toUpperCase(),
        ...(term ? { name: { contains: term, mode: "insensitive" as const } } : {}),
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, stateUf: true },
    });
  }
}
