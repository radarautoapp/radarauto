/**
 * Session DTOs.
 *
 * PublicSession é o que o backend retorna - exclui userId, refreshToken, etc.
 */

export interface PublicSession {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  isCurrent: boolean;
}

export interface ListSessionsResponse {
  sessions: PublicSession[];
  currentSessionId: string;
}

export interface RevokeSessionResponse {
  revoked: true;
}

export interface RevokeOthersResponse {
  revokedCount: number;
}
