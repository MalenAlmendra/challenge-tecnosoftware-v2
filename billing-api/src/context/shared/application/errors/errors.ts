// src/shared/application/errors/errors.ts

import { AppError } from './app-error';

/**
 * Factory centralizada de errores de aplicación.
 */
export const Errors = {

  Validation(
    message: string,
    details?: unknown,
  ): AppError {
    return new AppError({
      code: 'VALIDATION_ERROR',
      message,
      status: 400,
      details,
    });
  },

  Unauthorized(
    message = 'Unauthorized',
    details?: unknown,
  ): AppError {
    return new AppError({
      code: 'UNAUTHORIZED',
      message,
      status: 401,
      details,
    });
  },

  Forbidden(
    message = 'Forbidden',
    details?: unknown,
  ): AppError {
    return new AppError({
      code: 'FORBIDDEN',
      message,
      status: 403,
      details,
    });
  },

  NotFound(
    entity: string,
    details?: unknown,
  ): AppError {
    return new AppError({
      code: 'NOT_FOUND',
      message: `${entity} not found`,
      status: 404,
      details,
    });
  },

  Conflict(
    message: string,
    details?: unknown,
  ): AppError {
    return new AppError({
      code: 'CONFLICT',
      message,
      status: 409,
      details,
    });
  },

  Unprocessable(
    message: string,
    details?: unknown,
  ): AppError {
    return new AppError({
      code: 'UNPROCESSABLE_ENTITY',
      message,
      status: 422,
      details,
    });
  },

  Internal(
    message = 'Internal error',
    details?: unknown,
  ): AppError {
    return new AppError({
      code: 'INTERNAL_ERROR',
      message,
      status: 500,
      details,
      isOperational: false, 
    });
  },
};
