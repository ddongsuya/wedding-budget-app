/**
 * Property-Based Tests for Pagination Utility
 * 
 * **Feature: project-optimization, Property 2: Pagination Metadata Accuracy**
 * **Validates: Requirements 3.5**
 * 
 * Tests that pagination metadata is always accurate:
 * - totalPages = ceil(total / limit)
 * - returned items count <= limit
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  parsePaginationParams,
  calculateOffset,
  buildPaginationMeta,
  buildPaginatedResponse,
  validatePaginationParams,
  PaginationMeta,
} from './pagination';

describe('Pagination Utility - Property Based Tests', () => {
  /**
   * Property 2: Pagination Metadata Accuracy
   * *For any* paginated API endpoint with parameters `page` and `limit`, 
   * the response should include `totalPages = ceil(total / limit)` 
   * and the number of returned items should be `<= limit`.
   * 
   * **Validates: Requirements 3.5**
   */
  describe('Property 2: Pagination Metadata Accuracy', () => {
    it('totalPages should always equal ceil(total / limit)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }), // total items
          fc.integer({ min: 1, max: 100 }),   // limit per page
          fc.integer({ min: 1, max: 1000 }),  // page number
          (total, limit, page) => {
            const meta = buildPaginationMeta(total, page, limit);
            
            // Property: totalPages = ceil(total / limit)
            const expectedTotalPages = Math.ceil(total / limit);
            expect(meta.totalPages).toBe(expectedTotalPages);
            
            // Property: totalPages is always >= 0
            expect(meta.totalPages).toBeGreaterThanOrEqual(0);
            
            // Property: if total > 0, totalPages >= 1
            if (total > 0) {
              expect(meta.totalPages).toBeGreaterThanOrEqual(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('pagination metadata should preserve input values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }), // total
          fc.integer({ min: 1, max: 100 }),   // limit
          fc.integer({ min: 1, max: 1000 }),  // page
          (total, limit, page) => {
            const meta = buildPaginationMeta(total, page, limit);
            
            // Property: metadata preserves input values
            expect(meta.total).toBe(total);
            expect(meta.limit).toBe(limit);
            expect(meta.page).toBe(page);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('paginated response data length should be <= limit', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 0, maxLength: 200 }), // data array
          fc.integer({ min: 1, max: 100 }),                          // limit
          fc.integer({ min: 1, max: 100 }),                          // page
          (allData, limit, page) => {
            // Simulate pagination: slice data for current page
            const offset = (page - 1) * limit;
            const pageData = allData.slice(offset, offset + limit);
            const total = allData.length;
            
            const response = buildPaginatedResponse(pageData, total, page, limit);
            
            // Property: returned items count <= limit
            expect(response.data.length).toBeLessThanOrEqual(limit);
            
            // Property: pagination metadata is accurate
            expect(response.pagination.totalPages).toBe(Math.ceil(total / limit));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('parsePaginationParams', () => {
    it('should parse valid pagination parameters', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // page
          fc.integer({ min: 1, max: 100 }),  // limit
          (page, limit) => {
            const query = { page: String(page), limit: String(limit) };
            const result = parsePaginationParams(query);
            
            expect(result.page).toBe(page);
            expect(result.limit).toBe(Math.min(limit, 100)); // max limit is 100
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use default values for missing parameters', () => {
      const result = parsePaginationParams({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20); // default limit
    });

    it('should enforce minimum page of 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: 0 }), // invalid page values
          (invalidPage) => {
            const query = { page: String(invalidPage) };
            const result = parsePaginationParams(query);
            
            // Property: page is always >= 1
            expect(result.page).toBeGreaterThanOrEqual(1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should enforce maximum limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 101, max: 10000 }), // values exceeding max limit
          (excessiveLimit) => {
            const query = { limit: String(excessiveLimit) };
            const result = parsePaginationParams(query, 20, 100);
            
            // Property: limit is always <= maxLimit
            expect(result.limit).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('calculateOffset', () => {
    it('should calculate correct offset for any page and limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // page
          fc.integer({ min: 1, max: 100 }),  // limit
          (page, limit) => {
            const offset = calculateOffset(page, limit);
            
            // Property: offset = (page - 1) * limit
            expect(offset).toBe((page - 1) * limit);
            
            // Property: offset is always >= 0
            expect(offset).toBeGreaterThanOrEqual(0);
            
            // Property: first page has offset 0
            if (page === 1) {
              expect(offset).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('validatePaginationParams', () => {
    it('should return true for valid parameters', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // valid page
          fc.integer({ min: 1, max: 100 }),  // valid limit
          (page, limit) => {
            const result = validatePaginationParams(page, limit, 100);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return error message for invalid page', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: 0 }), // invalid page
          fc.integer({ min: 1, max: 100 }),   // valid limit
          (invalidPage, limit) => {
            const result = validatePaginationParams(invalidPage, limit, 100);
            expect(typeof result).toBe('string');
            expect(result).toContain('page');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should return error message for invalid limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),   // valid page
          fc.integer({ min: -1000, max: 0 }),  // invalid limit
          (page, invalidLimit) => {
            const result = validatePaginationParams(page, invalidLimit, 100);
            expect(typeof result).toBe('string');
            expect(result).toContain('limit');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should return error message for limit exceeding max', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),    // valid page
          fc.integer({ min: 101, max: 10000 }), // limit exceeding max
          (page, excessiveLimit) => {
            const result = validatePaginationParams(page, excessiveLimit, 100);
            expect(typeof result).toBe('string');
            expect(result).toContain('limit');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero total items', () => {
      const meta = buildPaginationMeta(0, 1, 10);
      expect(meta.totalPages).toBe(0);
      expect(meta.total).toBe(0);
    });

    it('should handle total items equal to limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // limit = total
          (limit) => {
            const meta = buildPaginationMeta(limit, 1, limit);
            expect(meta.totalPages).toBe(1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle total items one more than limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 99 }), // limit
          (limit) => {
            const total = limit + 1;
            const meta = buildPaginationMeta(total, 1, limit);
            expect(meta.totalPages).toBe(2);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
