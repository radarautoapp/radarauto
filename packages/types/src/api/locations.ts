/**
 * Locations — estados e cidades (fonte IBGE, persistido no banco).
 */

export interface StateItem {
  uf: string;
  name: string;
  region: string;
}

export interface CityItem {
  id: string;
  name: string;
  stateUf: string;
}

export interface ListStatesResponse {
  states: StateItem[];
}

export interface ListCitiesResponse {
  cities: CityItem[];
}
