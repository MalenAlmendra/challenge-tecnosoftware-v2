// src/shared/application/errors/app-error.ts

/**
 * AppError representa un error de negocio o de aplicación.
 */
export class AppError extends Error {
  /**
   * Código de error de negocio (ej: VALIDATION_ERROR, CONFLICT, NOT_FOUND)
   */
  public readonly code: string;

  /**
   * HTTP status sugerido (se traduce en infra)
   */
  public readonly status: number;

  /**
   * Información adicional útil para debugging o UI
   */
  public readonly details?: unknown;

  /**
   * Marca errores operacionales (esperados) vs bugs
   * Útil si más adelante integrás logging / Sentry
   */
  public readonly isOperational: boolean;

  constructor(
    params: {
      code: string;
      message: string;
      status?: number;
      details?: unknown;
      isOperational?: boolean;
    },
  ) {
    super(params.message);

    this.code = params.code;
    this.status = params.status ?? 400;
    this.details = params.details;
    this.isOperational = params.isOperational ?? true;

    // Necesario para que instanceof funcione bien en TS
    Object.setPrototypeOf(this, new.target.prototype);

    // Nombre de la clase para logs
    this.name = 'AppError';

    // Captura stack trace correctamente (Node)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
