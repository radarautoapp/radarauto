/**
 * Session domain types
 *
 * Múltiplas sessões ativas por usuário (multi-device).
 * Backend é fonte da verdade — frontend só consulta.
 */

export interface Session {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceLabel: string | null;
  lastSeenAt: string;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
}

export interface SessionPublic {
  id: string;
  deviceLabel: string | null;
  ipAddress: string | null;
  lastSeenAt: string;
  createdAt: string;
  isCurrent: boolean;
}
