/**
 * Pagination utility functions
 * Requirements: 3.5 - 일관된 페이지네이션 응답 포맷
 */

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Parse pagination parameters from query string
 * @param query - Express request query object
 * @param defaultLimit - Default limit if not specified (default: 20)
 * @param maxLimit - Maximum allowed limit (default: 100)
 */
export const parsePaginationParams = (
  query: Record<string, any>,
  defaultLimit: number = 20,
  maxLimit: number = 100
): PaginationParams => {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const requestedLimit = parseInt(query.limit as string) || defaultLimit;
  const limit = Math.min(Math.max(1, requestedLimit), maxLimit);
  
  return { page, limit };
};

/**
 * Calculate offset for SQL queries
 */
export const calculateOffset = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

/**
 * Build pagination metadata
 * @param total - Total number of items
 * @param page - Current page number
 * @param limit - Items per page
 */
export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Build a complete paginated response
 * @param data - Array of items for current page
 * @param total - Total number of items
 * @param page - Current page number
 * @param limit - Items per page
 */
export const buildPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> => {
  return {
    data,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

/**
 * Validate pagination parameters
 * Returns true if valid, error message if invalid
 */
export const validatePaginationParams = (
  page: number,
  limit: number,
  maxLimit: number = 100
): true | string => {
  if (page < 1) {
    return 'page는 1 이상이어야 합니다';
  }
  if (limit < 1) {
    return 'limit는 1 이상이어야 합니다';
  }
  if (limit > maxLimit) {
    return `limit는 ${maxLimit} 이하여야 합니다`;
  }
  return true;
};
