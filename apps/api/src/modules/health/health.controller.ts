/**
 * Health Controller
 *
 * Propósito: GET /health responde status básico.
 * Não exige autenticação. Sem PII. Lightweight.
 */
import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check(): { status: "ok"; service: "radar-api"; timestamp: string; uptime: number } {
    return {
      status: "ok",
      service: "radar-api",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
