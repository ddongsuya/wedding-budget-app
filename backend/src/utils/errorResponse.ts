/**
 * Standardized Error Response Utilities
 * Ensures consistent error response format across all API endpoints
 * 
 * Standard Error Response Format:
 * {
 *   success: false,
 *   message: string,
 *   code?: string,
 *   errors?: Array<{ field: string, message: string }>
 * }
 */

import { Response } from 'express';

export interface ErrorResponseData {
  success: false;
  message: string;
  code?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface SuccessResponseData<T = any> {
  success: true;
  data?: T;
  message?: string;
}

/**
 * Standard error codes for common scenarios
 */
export const ErrorCodes = {
  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  ADMIN_REQUIRED: 'ADMIN_REQUIRED',
  
  // Resource errors (404)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  COUPLE_NOT_FOUND: 'COUPLE_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Conflict errors (409)
  CONFLICT: 'CONFLICT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Rate limiting (429)
  RATE_LIMITED: 'RATE_LIMITED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  
  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

/**
 * Send a standardized error response
 */
export const sendError = (
  res: Response,
  status: number,
  message: string,
  code?: string,
  errors?: Array<{ field: string; message: string }>
): Response => {
  const response: ErrorResponseData = {
    success: false,
    message,
  };

  if (code) {
    response.code = code;
  }

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  return res.status(status).json(response);
};

/**
 * Send a standardized success response
 */
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  status: number = 200
): Response => {
  const response: SuccessResponseData<T> = {
    success: true,
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  return res.status(status).json(response);
};

// Convenience methods for common error types

export const sendBadRequest = (
  res: Response,
  message: string = '잘못된 요청입니다',
  code: string = ErrorCodes.INVALID_INPUT,
  errors?: Array<{ field: string; message: string }>
): Response => sendError(res, 400, message, code, errors);

export const sendUnauthorized = (
  res: Response,
  message: string = '인증이 필요합니다',
  code: string = ErrorCodes.UNAUTHORIZED
): Response => sendError(res, 401, message, code);

export const sendForbidden = (
  res: Response,
  message: string = '접근 권한이 없습니다',
  code: string = ErrorCodes.FORBIDDEN
): Response => sendError(res, 403, message, code);

export const sendNotFound = (
  res: Response,
  message: string = '리소스를 찾을 수 없습니다',
  code: string = ErrorCodes.NOT_FOUND
): Response => sendError(res, 404, message, code);

export const sendConflict = (
  res: Response,
  message: string = '이미 존재하는 데이터입니다',
  code: string = ErrorCodes.CONFLICT
): Response => sendError(res, 409, message, code);

export const sendRateLimited = (
  res: Response,
  message: string = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요',
  code: string = ErrorCodes.RATE_LIMITED
): Response => sendError(res, 429, message, code);

export const sendInternalError = (
  res: Response,
  message: string = '서버 오류가 발생했습니다',
  code: string = ErrorCodes.INTERNAL_ERROR
): Response => sendError(res, 500, message, code);

/**
 * Handle database-specific errors and return appropriate response
 */
export const handleDatabaseError = (
  res: Response,
  error: any,
  defaultMessage: string = '데이터베이스 오류가 발생했습니다'
): Response => {
  console.error('Database error:', error);

  // PostgreSQL error codes
  if (error.code === '23505') {
    // Unique violation
    return sendConflict(res, '이미 존재하는 데이터입니다', ErrorCodes.DUPLICATE_ENTRY);
  }

  if (error.code === '23503') {
    // Foreign key violation
    return sendBadRequest(res, '참조하는 데이터가 존재하지 않습니다', ErrorCodes.INVALID_INPUT);
  }

  if (error.code === '23502') {
    // Not null violation
    return sendBadRequest(res, '필수 필드가 누락되었습니다', ErrorCodes.MISSING_REQUIRED_FIELD);
  }

  if (error.code === '22P02') {
    // Invalid text representation (e.g., invalid UUID)
    return sendBadRequest(res, '잘못된 데이터 형식입니다', ErrorCodes.INVALID_INPUT);
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    // Connection refused
    return sendInternalError(res, '데이터베이스 연결에 실패했습니다', ErrorCodes.DATABASE_ERROR);
  }

  return sendInternalError(res, defaultMessage, ErrorCodes.DATABASE_ERROR);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
