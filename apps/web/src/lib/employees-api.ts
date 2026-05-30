/**
 * lib/employees-api.ts
 */
import type {
  AcceptInviteRequest,
  AcceptInviteResponse,
  InviteEmployeeRequest,
  InviteEmployeeResponse,
  InviteInfoResponse,
  ListEmployeesResponse,
  ResendInviteResponse,
} from "@radar/types";

import { apiFetch } from "./api";

export const employeesApi = {
  async list(): Promise<ListEmployeesResponse> {
    return apiFetch<ListEmployeesResponse>("/employees", { method: "GET" });
  },

  async invite(body: InviteEmployeeRequest): Promise<InviteEmployeeResponse> {
    return apiFetch<InviteEmployeeResponse>("/employees/invite", {
      method: "POST",
      body,
    });
  },

  async resend(id: string): Promise<ResendInviteResponse> {
    return apiFetch<ResendInviteResponse>(`/employees/${id}/resend`, {
      method: "POST",
    });
  },

  async remove(id: string): Promise<void> {
    await apiFetch(`/employees/${id}`, { method: "DELETE" });
  },

  // Público
  async getInvite(token: string): Promise<InviteInfoResponse> {
    return apiFetch<InviteInfoResponse>(`/employees/invite/${token}`, {
      method: "GET",
      skipAuth: true,
    });
  },

  async acceptInvite(token: string, body: AcceptInviteRequest): Promise<AcceptInviteResponse> {
    return apiFetch<AcceptInviteResponse>(`/employees/invite/${token}`, {
      method: "POST",
      body,
      skipAuth: true,
    });
  },
};
