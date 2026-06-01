/**
 * Tipos da API de leads (tela do lojista).
 */

export type LeadScoreLabel = "COLD" | "WARM" | "HOT";

export interface LeadItem {
  id: string;
  name: string;
  /** Telefone só vem quando o lead tentou contato (LGPD). */
  phone: string | null;
  score: LeadScoreLabel;
  /** Pontuação fina 0–100 (ordenação/visual). */
  points: number;
  clicks: number;
  timeSeconds: number;
  favorited: boolean;
  whatsappClicked: boolean;
  telegramClicked: boolean;
  lastSeen: string;
}

export interface LeadVehicleGroup {
  vehicleId: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  price: number;
  coverPhoto: string | null;
  totalLeads: number;
  hotCount: number;
  leads: LeadItem[];
}

export interface LeadsResponse {
  items: LeadVehicleGroup[];
  totalLeads: number;
  totalHot: number;
}
