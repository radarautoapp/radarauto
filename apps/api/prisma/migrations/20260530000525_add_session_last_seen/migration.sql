-- AlterTable: Session.lastSeenAt
-- Adiciona quando a sessao foi usada pela ultima vez (atualizado por interceptor).
ALTER TABLE "Session" ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
