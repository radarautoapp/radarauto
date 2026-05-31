/**
 * lib/vehicles-api.ts
 *
 * Cria veículo via multipart (dados JSON + fotos).
 * Usa fetch direto (não apiFetch) porque envia FormData, não JSON.
 */
import { tokenStorage } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface CreateVehiclePayload {
  brand: string;
  model: string;
  version: string;
  year: number;
  yearModel: number;
  km: number;
  fuel: string;
  transm: string;
  color: string;
  colorHex: string;
  plate?: string;
  category: string;
  price: number; // centavos
  fipe: number; // centavos
  city: string;
  state: string;
  optionals: string[];
  obs?: string;
  delivery: boolean;
}

export interface CreateVehicleResult {
  id: string;
  status: string;
  photos: string[];
}

export const vehiclesApi = {
  async create(payload: CreateVehiclePayload, photos: File[]): Promise<CreateVehicleResult> {
    const fd = new FormData();
    fd.append("data", JSON.stringify(payload));
    for (const photo of photos) {
      fd.append("photos", photo, photo.name);
    }

    const token = tokenStorage.get();
    const res = await fetch(`${API_URL}/api/v1/vehicles`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });

    if (!res.ok) {
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        body = { code: "UNKNOWN", message: "Falha ao cadastrar veículo." };
      }
      throw body;
    }

    return (await res.json()) as CreateVehicleResult;
  },
};
