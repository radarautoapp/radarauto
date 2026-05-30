/**
 * LocationsController
 *
 * GET /locations/states           — 27 estados
 * GET /locations/cities?uf=SC&q=  — cidades do estado (autocomplete)
 * Autenticado.
 */
import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import type { ListCitiesResponse, ListStatesResponse } from "@radar/types";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { LocationsService } from "./locations.service";

@Controller("locations")
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get("states")
  async states(): Promise<ListStatesResponse> {
    const states = await this.locations.listStates();
    return { states };
  }

  @Get("cities")
  async cities(@Query("uf") uf: string, @Query("q") q?: string): Promise<ListCitiesResponse> {
    if (!uf) return { cities: [] };
    const cities = await this.locations.listCities(uf, q);
    return { cities };
  }
}
