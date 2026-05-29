/**
 * Lead domain types
 *
 * Propósito: representa interessados em veículos de uma loja.
 * Score calculado no backend (Regras 6, 20). NUNCA no frontend.
 */

export type LeadScore = "COLD" | "WARM" | "HOT";

export interface Lead {
  id: string;
  storeId: string;
  vehicleId: string;
  visitorId: string; // anonimizado ou userId
  name: string;
  score: LeadScore; // calculado pelo backend
  clicks: number;
  favorited: boolean;
  avgTimeSeconds: number;
  whatsappClicked: boolean;
  telegramClicked: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}
