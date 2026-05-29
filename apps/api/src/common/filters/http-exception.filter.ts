/**
 * HttpExceptionFilter — Regra 28
 *
 * Propósito: padroniza TODA resposta de erro da API no formato:
 *   { code: string, message: string, details?: object }
 *
 * Segurança: NUNCA vaza stack trace pro client (Regra 5).
 * Logging: erros 500 são logados com correlation ID (Regra 31).
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

interface ErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { correlationId?: string }>();

    const { status, payload } = this.buildResponse(exception);

    // Log apenas erros internos (5xx) com detalhe
    if (status >= 500) {
      this.logger.error({
        correlationId: request.correlationId,
        path: request.url,
        method: request.method,
        statusCode: status,
        error: exception instanceof Error ? exception.message : "Unknown",
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    }

    response.status(status).json(payload);
  }

  private buildResponse(exception: unknown): { status: number; payload: ErrorPayload } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      // Já vem no formato padrão?
      if (typeof res === "object" && res !== null && "code" in res && "message" in res) {
        return { status, payload: res as ErrorPayload };
      }

      // Fallback: monta payload a partir do que existe
      const message =
        typeof res === "string"
          ? res
          : ((res as { message?: string | string[] }).message ??
              exception.message ??
              "Erro inesperado");

      return {
        status,
        payload: {
          code: this.codeFromStatus(status),
          message: Array.isArray(message) ? message.join("; ") : message,
        },
      };
    }

    // Erro não-tratado: sempre 500 + mensagem genérica (sem vazar)
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      payload: {
        code: "INTERNAL_ERROR",
        message: "Ocorreu um erro inesperado. Tente novamente em instantes.",
      },
    };
  }

  private codeFromStatus(status: number): string {
    const map: Record<number, string> = {
      400: "VALIDATION_FAILED",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "UNPROCESSABLE_ENTITY",
      429: "RATE_LIMITED",
      500: "INTERNAL_ERROR",
      503: "SERVICE_UNAVAILABLE",
    };
    return map[status] ?? "UNKNOWN_ERROR";
  }
}
