/**
 * Health Controller
 *
 * Propósito: GET /health responde status básico.
 * Pública (sem autenticação). Sem PII. Lightweight.
 */
import { Controller, Get } from "@nestjs/common";

import { Public } from "../../common/decorators/public.decorator";

@Controller("health")
export class HealthController {
  @Public()
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
