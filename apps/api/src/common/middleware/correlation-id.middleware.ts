/**
 * CorrelationIdMiddleware — Regra 31
 *
 * Propósito: garante x-correlation-id em todo request. Gerado se ausente.
 * Usado em todos os logs pra rastrear request end-to-end.
 */
import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request & { correlationId?: string }, res: Response, next: NextFunction): void {
    const incoming = req.headers["x-correlation-id"];
    const correlationId = typeof incoming === "string" && incoming.length > 0 ? incoming : uuidv4();

    req.correlationId = correlationId;
    res.setHeader("x-correlation-id", correlationId);
    next();
  }
}
