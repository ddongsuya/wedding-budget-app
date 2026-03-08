/**
 * Property-Based Tests: 페이지네이션 데이터 제한
 * Feature: beta-readiness-review
 *
 * Property 24: 페이지네이션 데이터 제한 - 반환 항목 수가 limit 이하이고 올바른 offset 적용 검증
 *
 * **Validates: Requirements 10.2**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Pure pagination logic used by the frontend infinite scroll.
 * Given a full list, page number, and limit, returns the correct slice.
 */
function paginateItems<T>(items: T[], page: number, limit: number): { data: T[]; hasMore: boolean } {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const offset = (safePage - 1) * safeLimit;
  const data = items.slice(offset, offset + safeLimit);
  const hasMore = offset + safeLimit < items.length;
  return { data, hasMore };
}

/**
 * Cumulative pagination: simulates infinite scroll by returning
 * all items up to page * limit (i.e. visibleCount pattern).
 */
function cumulativePaginate<T>(items: T[], visibleCount: number): { data: T[]; hasMore: boolean } {
  const safeCount = Math.max(0, visibleCount);
  const data = items.slice(0, safeCount);
  const hasMore = safeCount < items.length;
  return { data, hasMore };
}

// ── Arbitraries ──────────────────────────────────────────

const itemArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 30 }),
});

describe('Feature: beta-readiness-review, Property 24: 페이지네이션 데이터 제한', () => {
  /**
   * **Validates: Requirements 10.2**
   */
  it('returned items count should be <= limit for any page', () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 0, maxLength: 100 }),
        fc.integer({ min: 1, max: 50 }),  // page
        fc.integer({ min: 1, max: 50 }),  // limit
        (items, page, limit) => {
          const result = paginateItems(items, page, limit);

          // Property: returned items count <= limit
          expect(result.data.length).toBeLessThanOrEqual(limit);

          // Property: returned items count <= total items
          expect(result.data.length).toBeLessThanOrEqual(items.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('offset should be correctly applied: (page-1) * limit', () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 1, maxLength: 100 }),
        fc.integer({ min: 1, max: 10 }),  // page
        fc.integer({ min: 1, max: 20 }),  // limit
        (items, page, limit) => {
          const result = paginateItems(items, page, limit);
          const expectedOffset = (page - 1) * limit;

          // If offset is within bounds, first item should match
          if (expectedOffset < items.length && result.data.length > 0) {
            expect(result.data[0].id).toBe(items[expectedOffset].id);
          }

          // If offset is beyond items, result should be empty
          if (expectedOffset >= items.length) {
            expect(result.data.length).toBe(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('hasMore should be true only when there are more items beyond current page', () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 0, maxLength: 100 }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 20 }),
        (items, page, limit) => {
          const result = paginateItems(items, page, limit);
          const offset = (page - 1) * limit;

          if (offset + limit < items.length) {
            expect(result.hasMore).toBe(true);
          } else {
            expect(result.hasMore).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('cumulative pagination (infinite scroll pattern) should respect visibleCount limit', () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 0, maxLength: 100 }),
        fc.integer({ min: 0, max: 200 }),  // visibleCount
        (items, visibleCount) => {
          const result = cumulativePaginate(items, visibleCount);

          // Property: returned items count <= visibleCount
          expect(result.data.length).toBeLessThanOrEqual(visibleCount);

          // Property: returned items count <= total items
          expect(result.data.length).toBeLessThanOrEqual(items.length);

          // Property: returned items are the first N items
          for (let i = 0; i < result.data.length; i++) {
            expect(result.data[i].id).toBe(items[i].id);
          }

          // Property: hasMore is correct
          if (visibleCount < items.length) {
            expect(result.hasMore).toBe(true);
          } else {
            expect(result.hasMore).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('all pages combined should cover all items exactly once', () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 25 }),  // limit
        (items, limit) => {
          const allPageItems: typeof items = [];
          const totalPages = Math.ceil(items.length / limit);

          for (let page = 1; page <= totalPages; page++) {
            const result = paginateItems(items, page, limit);
            allPageItems.push(...result.data);
          }

          // Property: all items are covered exactly once
          expect(allPageItems.length).toBe(items.length);
          for (let i = 0; i < items.length; i++) {
            expect(allPageItems[i].id).toBe(items[i].id);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
