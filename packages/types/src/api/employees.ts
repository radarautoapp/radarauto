/**
 * Employee DTOs (frontend ↔ backend).
 */

export type EmployeeStatus = "PENDING_ACTIVATION" | "ACTIVE";

export interface Employee {
  id: string;
  email: string;
  name: string;
  status: EmployeeStatus;
  createdAt: string;
  invite?: {
    expiresAt: string;
    usedAt: string | null;
  };
}

export interface ListEmployeesResponse {
  employees: Employee[];
}

export interface InviteEmployeeRequest {
  email: string;
}

export interface InviteEmployeeResponse {
  employee: Employee;
}

export interface ResendInviteResponse {
  employee: Employee;
}

// Públicas

export interface InviteInfoResponse {
  email: string;
  storeName: string;
  expiresAt: string;
}

export interface AcceptInviteRequest {
  name: string;
  password: string;
  phone?: string;
}

export interface AcceptInviteResponse {
  userId: string;
}
