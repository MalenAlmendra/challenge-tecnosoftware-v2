// infrastructure/http/filters/app-error.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '../../../application/errors/app-error';

type ErrorResponse = {
  code: string;
  message: string;
  details?: unknown;
  correlationId?: string;
};

@Catch() 
export class AppErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const correlationId =
      (req.headers['x-correlation-id'] as string | undefined) ??
      (req.headers['x-request-id'] as string | undefined);

    if (exception instanceof AppError) {
      const payload: ErrorResponse = {
        code: exception.code,
        message: exception.message,
        details: exception.details,
        correlationId,
      };

      return res.status(exception.status).json(payload);
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse() as any;

      const message =
        typeof response === 'string'
          ? response
          : Array.isArray(response?.message)
            ? response.message.join(', ')
            : response?.message ?? exception.message;

      const code = this.mapHttpStatusToCode(status);

      const payload: ErrorResponse = {
        code,
        message,
        details: typeof response === 'object' ? response : undefined,
        correlationId,
      };

      return res.status(status).json(payload);
    }

    const payload: ErrorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected error',
      correlationId,
    };

    // eslint-disable-next-line no-console
    console.error('[UnhandledException]', exception);

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(payload);
  }

  private mapHttpStatusToCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      default:
        return 'HTTP_ERROR';
    }
  }
}
