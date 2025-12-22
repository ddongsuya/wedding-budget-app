/**
 * Global Error Handler Middleware
 * Provides centralized error handling for all API endpoints
 * 
 * Requirements: 10.4 - Consistent error response format
 * Requirements: 9.4 - Stack trace hiding in production
 */

import { Request, Response, NextFunction } from 'express';
import { sentryErrorHandler, captureError } from '../lib/sentry';
import { ErrorCodes, ErrorResponseData } from '../utils/errorResponse';

/**
 * Log Levels for error categorization
 * Requirements: 9.4 - Appropriate log level settings
 */
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

/**
 * Get appropriate log level based on status code
 */
const getLogLevel = (statusCode: number): LogLevel => {
  if (statusCode >= 500) return LogLevel.ERROR;
  if (statusCode >= 400) return LogLevel.WARN;
  return LogLevel.INFO;
};

/**
 * Structured logger for production
 * Requirements: 9.4 - Production error logging without exposing internals
 */
const logError = (
  level: LogLevel,
  message: string,
  context: Record<string, any>
): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
    // Stack trace only in non-production
    ...(isProduction ? {} : { stack: context.stack }),
  };
  
  // Remove stack from context for production
  if (isProduction) {
    delete logEntry.stack;
  }
  
  // Use appropriate console method based on level
  switch (level) {
    case LogLevel.ERROR:
    case LogLevel.FATAL:
      console.error(JSON.stringify(logEntry));
      break;
    case LogLevel.WARN:
      console.warn(JSON.stringify(logEntry));
      break;
    default:
      console.log(JSON.stringify(logEntry));
  }
};

/**
 * Custom Application Error class
 * Use this for throwing errors with specific status codes and error codes
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly errors?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = ErrorCodes.INTERNAL_ERROR,
    errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.errors = errors;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Convenience error classes
export class BadRequestError extends AppError {
  constructor(message: string = '잘못된 요청입니다', code: string = ErrorCodes.INVALID_INPUT) {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '인증이 필요합니다', code: string = ErrorCodes.UNAUTHORIZED) {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '접근 권한이 없습니다', code: string = ErrorCodes.FORBIDDEN) {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '리소스를 찾을 수 없습니다', code: string = ErrorCodes.NOT_FOUND) {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = '이미 존재하는 데이터입니다', code: string = ErrorCodes.CONFLICT) {
    super(message, 409, code);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = '입력값이 올바르지 않습니다',
    errors?: Array<{ field: string; message: string }>
  ) {
    super(message, 400, ErrorCodes.VALIDATION_ERROR, errors);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요') {
    super(message, 429, ErrorCodes.RATE_LIMITED);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = '데이터베이스 오류가 발생했습니다') {
    super(message, 500, ErrorCodes.DATABASE_ERROR);
  }
}

/**
 * Map PostgreSQL error codes to appropriate HTTP responses
 */
const mapPostgresError = (error: any): { statusCode: number; code: string; message: string } => {
  switch (error.code) {
    case '23505': // unique_violation
      return { statusCode: 409, code: ErrorCodes.DUPLICATE_ENTRY, message: '이미 존재하는 데이터입니다' };
    case '23503': // foreign_key_violation
      return { statusCode: 400, code: ErrorCodes.INVALID_INPUT, message: '참조하는 데이터가 존재하지 않습니다' };
    case '23502': // not_null_violation
      return { statusCode: 400, code: ErrorCodes.MISSING_REQUIRED_FIELD, message: '필수 필드가 누락되었습니다' };
    case '22P02': // invalid_text_representation
      return { statusCode: 400, code: ErrorCodes.INVALID_INPUT, message: '잘못된 데이터 형식입니다' };
    case 'ECONNREFUSED':
    case 'ENOTFOUND':
      return { statusCode: 500, code: ErrorCodes.DATABASE_ERROR, message: '데이터베이스 연결에 실패했습니다' };
    default:
      return { statusCode: 500, code: ErrorCodes.DATABASE_ERROR, message: '데이터베이스 오류가 발생했습니다' };
  }
};

/**
 * Global Error Handler Middleware
 * Catches all errors and returns consistent JSON responses
 * 
 * Requirements: 9.4 - Stack trace hiding in production
 * Requirements: 10.4 - Consistent error response format
 */
export const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Default error values
  let statusCode = 500;
  let errorCode: string = ErrorCodes.INTERNAL_ERROR;
  let message = '서버 오류가 발생했습니다';
  let errors: Array<{ field: string; message: string }> | undefined;

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    errors = err.errors;
  }
  // Handle specific error types
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = ErrorCodes.VALIDATION_ERROR;
    message = err.message || '입력값이 올바르지 않습니다';
  }
  else if (err.name === 'UnauthorizedError' || err.message?.includes('jwt')) {
    statusCode = 401;
    errorCode = ErrorCodes.UNAUTHORIZED;
    message = '인증이 필요합니다';
  }
  else if ((err as any).code === 'CORS') {
    statusCode = 403;
    errorCode = ErrorCodes.FORBIDDEN;
    message = 'CORS 정책에 의해 차단되었습니다';
  }
  // Handle PostgreSQL errors
  else if ((err as any).code && typeof (err as any).code === 'string') {
    const pgError = mapPostgresError(err);
    statusCode = pgError.statusCode;
    errorCode = pgError.code;
    message = pgError.message;
  }
  // Handle status/statusCode from error object
  else if ((err as any).status || (err as any).statusCode) {
    statusCode = (err as any).status || (err as any).statusCode;
    errorCode = (err as any).code || ErrorCodes.INTERNAL_ERROR;
    message = err.message || '서버 오류가 발생했습니다';
  }

  // Get appropriate log level
  const logLevel = getLogLevel(statusCode);
  
  // Log error with structured format - Requirements 9.4
  logError(logLevel, err.message, {
    errorCode,
    statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.id,
    stack: err.stack,
    // Additional context for debugging (non-production only)
    ...(isProduction ? {} : {
      query: req.query,
      body: req.body ? '[PRESENT]' : undefined,
    }),
  });

  // Send error to Sentry for 500 errors
  if (statusCode >= 500) {
    try {
      captureError(err, {
        path: req.path,
        method: req.method,
        statusCode,
        errorCode,
      });
    } catch (sentryError) {
      console.error('Failed to send error to Sentry:', sentryError);
    }
  }

  // Hide internal error details in production for 500 errors
  // Requirements: 9.4 - Do not expose internal system details
  if (isProduction && statusCode === 500) {
    message = '서버 오류가 발생했습니다';
  }

  // Build response
  const response: ErrorResponseData = {
    success: false,
    message,
    code: errorCode,
  };

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found Handler
 * Handles requests to undefined routes
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다',
    code: ErrorCodes.NOT_FOUND,
  });
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass them to the error handler
 */
export const asyncHandler = <T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
