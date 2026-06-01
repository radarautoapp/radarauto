/**
 * lib/vehicles-api.ts
 *
 * Cria veículo via multipart (dados JSON + fotos).
 * Usa fetch direto (não apiFetch) porque envia FormData, não JSON.
 */
import type {
  ApproveVehicleResponse,
  ListVehiclesResponse,
  RemoveVehicleResponse,
  SetVehicleStatusResponse,
} from "@radar/types";

import { apiFetch, tokenStorage } from "@/lib/api";

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

export interface VehicleEditData {
  id: string;
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
  plate: string | null;
  category: string;
  price: number;
  fipe: number;
  city: string;
  state: string;
  optionals: string[];
  obs: string | null;
  delivery: boolean;
  photos: string[];
  status: string;
}

export const vehiclesApi = {
  async list(): Promise<ListVehiclesResponse> {
    return apiFetch<ListVehiclesResponse>("/vehicles", { method: "GET" });
  },

  async approve(id: string): Promise<ApproveVehicleResponse> {
    return apiFetch<ApproveVehicleResponse>(`/vehicles/${id}/approve`, {
      method: "POST",
    });
  },

  async setStatus(
    id: string,
    action: "pause" | "activate" | "sell" | "unsell",
  ): Promise<SetVehicleStatusResponse> {
    return apiFetch<SetVehicleStatusResponse>(`/vehicles/${id}/status`, {
      method: "PATCH",
      body: { action },
    });
  },

  async remove(id: string): Promise<RemoveVehicleResponse> {
    return apiFetch<RemoveVehicleResponse>(`/vehicles/${id}`, {
      method: "DELETE",
    });
  },

  async findOne(id: string): Promise<VehicleEditData> {
    return apiFetch<VehicleEditData>(`/vehicles/${id}`, { method: "GET" });
  },

  async update(
    id: string,
    payload: CreateVehiclePayload,
    photoOrder: string[],
    newPhotos: File[],
  ): Promise<{ id: string; photos: string[] }> {
    const fd = new FormData();
    fd.append("data", JSON.stringify({ ...payload, photoOrder }));
    for (const photo of newPhotos) {
      fd.append("photos", photo, photo.name);
    }

    const token = tokenStorage.get();
    const res = await fetch(`${API_URL}/api/v1/vehicles/${id}`, {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });

    if (!res.ok) {
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        body = { code: "UNKNOWN", message: "Falha ao atualizar veículo." };
      }
      throw body;
    }

    return (await res.json()) as { id: string; photos: string[] };
  },

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
