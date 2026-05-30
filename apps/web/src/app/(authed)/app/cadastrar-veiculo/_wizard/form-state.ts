/**
 * Tipos do formulário de veículo + autosave em localStorage.
 */

export interface VehicleFormState {
  // Step 0-3: FIPE
  brandCode: string;
  brandName: string;
  brandLogoUrl: string | null;
  modelCode: string;
  modelName: string;
  yearCode: string;
  yearName: string;
  year: number; // fabricação
  yearModel: number;
  // Step 4
  category: string;
  // Step 5: especificações
  fuel: string;
  transm: string;
  color: string;
  colorHex: string;
  km: number | "";
  plate: string;
  // Step 6: localização
  state: string;
  city: string;
  // Step 7: preço (em centavos)
  fipeCents: number;
  priceReais: number | ""; // o que o usuário digita (reais)
  // Step 8
  optionals: string[];
  delivery: boolean;
  // Step 9
  photos: string[]; // URLs (4.1c implementa upload)
  obs: string;
}

export const BLANK_VEHICLE_FORM: VehicleFormState = {
  brandCode: "",
  brandName: "",
  brandLogoUrl: null,
  modelCode: "",
  modelName: "",
  yearCode: "",
  yearName: "",
  year: 0,
  yearModel: 0,
  category: "",
  fuel: "",
  transm: "Manual",
  color: "",
  colorHex: "",
  km: "",
  plate: "",
  state: "",
  city: "",
  fipeCents: 0,
  priceReais: "",
  optionals: [],
  delivery: true,
  photos: [],
  obs: "",
};

const STORAGE_KEY = "radar:vehicle-draft";

export function loadDraft(): VehicleFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return { ...BLANK_VEHICLE_FORM, ...(JSON.parse(raw) as Partial<VehicleFormState>) };
  } catch {
    return null;
  }
}

export function saveDraft(form: VehicleFormState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  } catch {
    // ignora (quota, modo privado, etc.)
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignora
  }
}
