/**
 * CnpjLookup types
 *
 * Contrato unificado da consulta de CNPJ.
 * Independente da fonte (BrasilAPI, ReceitaWS, Serpro).
 * Backend normaliza qualquer provider pra esse formato.
 */

export type CnpjStatus = "ATIVA" | "BAIXADA" | "SUSPENSA" | "INAPTA" | "NULA" | "DESCONHECIDA";

export interface CnpjPartner {
  name: string;
  role: string | null;
}

export interface CnpjLookupResponse {
  cnpj: string;
  legalName: string;
  tradeName: string | null;
  status: CnpjStatus;
  statusReason: string | null;
  openedAt: string | null;
  phone: string | null;
  email: string | null;
  city: string;
  state: string;
  zip: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  mainActivityCode: string | null;
  mainActivityName: string | null;
  partners: CnpjPartner[];
  source: "brasilapi" | "receitaws" | "cache";
  fetchedAt: string;
}
