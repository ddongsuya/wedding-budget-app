/**
 * API Response Sanitization Utilities
 * Requirements 9.3: API 응답에서 민감한 필드 제외
 * 
 * This module provides utilities to remove sensitive fields from API responses
 * before sending them to clients.
 */

// Fields that should never be exposed in API responses
const SENSITIVE_USER_FIELDS = [
  'password',
  'reset_token',
  'reset_token_expires',
  'failed_login_attempts',
  'locked_until',
] as const;

// Fields that should be excluded from admin user listings
const ADMIN_EXCLUDED_FIELDS = [
  'password',
  'reset_token',
  'reset_token_expires',
] as const;

// Internal fields that shouldn't be exposed
const INTERNAL_FIELDS = [
  'token_hash',
] as const;

/**
 * Removes sensitive fields from a user object
 * @param user - User object from database
 * @returns Sanitized user object without sensitive fields
 */
export const sanitizeUser = <T extends Record<string, unknown>>(user: T | null | undefined): Partial<T> | null => {
  if (!user) return null;
  
  const sanitized = { ...user };
  
  for (const field of SENSITIVE_USER_FIELDS) {
    delete sanitized[field as keyof T];
  }
  
  return sanitized;
};

/**
 * Removes sensitive fields from an array of user objects
 * @param users - Array of user objects from database
 * @returns Array of sanitized user objects
 */
export const sanitizeUsers = <T extends Record<string, unknown>>(users: T[]): Partial<T>[] => {
  return users.map(user => sanitizeUser(user) as Partial<T>);
};

/**
 * Removes sensitive fields from user objects in admin context
 * (slightly less restrictive than regular sanitization)
 * @param user - User object from database
 * @returns Sanitized user object for admin view
 */
export const sanitizeUserForAdmin = <T extends Record<string, unknown>>(user: T | null | undefined): Partial<T> | null => {
  if (!user) return null;
  
  const sanitized = { ...user };
  
  for (const field of ADMIN_EXCLUDED_FIELDS) {
    delete sanitized[field as keyof T];
  }
  
  return sanitized;
};

/**
 * Removes sensitive fields from an array of user objects for admin view
 * @param users - Array of user objects from database
 * @returns Array of sanitized user objects for admin view
 */
export const sanitizeUsersForAdmin = <T extends Record<string, unknown>>(users: T[]): Partial<T>[] => {
  return users.map(user => sanitizeUserForAdmin(user) as Partial<T>);
};

/**
 * Generic function to exclude specific fields from an object
 * @param obj - Object to sanitize
 * @param fieldsToExclude - Array of field names to remove
 * @returns Object without the specified fields
 */
export const excludeFields = <T extends Record<string, unknown>>(
  obj: T | null | undefined,
  fieldsToExclude: string[]
): Partial<T> | null => {
  if (!obj) return null;
  
  const sanitized = { ...obj };
  
  for (const field of fieldsToExclude) {
    delete sanitized[field as keyof T];
  }
  
  return sanitized;
};

/**
 * Selects only specific fields from an object
 * @param obj - Object to filter
 * @param fieldsToInclude - Array of field names to keep
 * @returns Object with only the specified fields
 */
export const selectFields = <T extends Record<string, unknown>>(
  obj: T | null | undefined,
  fieldsToInclude: string[]
): Partial<T> | null => {
  if (!obj) return null;
  
  const result: Partial<T> = {};
  
  for (const field of fieldsToInclude) {
    if (field in obj) {
      result[field as keyof T] = obj[field as keyof T];
    }
  }
  
  return result;
};

/**
 * Sanitizes database error messages to prevent information leakage
 * @param error - Error object
 * @param defaultMessage - Default message to return in production
 * @returns Safe error message
 */
export const sanitizeErrorMessage = (error: Error, defaultMessage: string = '서버 오류가 발생했습니다'): string => {
  if (process.env.NODE_ENV === 'production') {
    return defaultMessage;
  }
  return error.message;
};

/**
 * Public user fields that are safe to expose
 */
export const PUBLIC_USER_FIELDS = [
  'id',
  'email',
  'name',
  'created_at',
  'is_admin',
  'couple_id',
  'role',
] as const;

/**
 * Creates a public user object with only safe fields
 * @param user - User object from database
 * @returns Public user object
 */
export const toPublicUser = <T extends Record<string, unknown>>(user: T | null | undefined): Partial<T> | null => {
  return selectFields(user, PUBLIC_USER_FIELDS as unknown as string[]);
};
