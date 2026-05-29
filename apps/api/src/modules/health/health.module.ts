/**
 * Health Module
 *
 * Propósito: endpoints de saúde da API (smoke test + readiness).
 * Usado por load balancer / k8s / monitoring.
 */
import { Module } from "@nestjs/common";

import { HealthController } from "./health.controller";

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
