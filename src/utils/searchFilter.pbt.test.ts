/**
 * Property-Based Tests: 검색 및 필터 유틸리티
 * Feature: beta-readiness-review
 *
 * Property 33: 검색 필터링 정확성 - 검색 결과가 제목에 쿼리를 포함하는 항목만 반환
 * Property 34: 검색어 초기화 - 비어있지 않은 검색 쿼리에 X 버튼 표시, 클릭 시 초기화
 * Property 35: 완료/미완료 필터 토글 - 미완료 필터 시 is_completed=false 항목만 표시
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  filterByTitle,
  filterScheduleItems,
  filterByCompletion,
  shouldShowClearButton,
  clearSearchQuery,
  type SearchableItem,
  type ChecklistFilterItem,
  type ScheduleFilterItem,
} from './searchFilter';

// ── Arbitraries ──────────────────────────────────────────

const searchableItemArb: fc.Arbitrary<SearchableItem> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
});

const checklistItemArb: fc.Arbitrary<ChecklistFilterItem> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  is_completed: fc.boolean(),
});

const categoryLabelArb = fc.option(
  fc.constantFrom('식장 방문', '피팅/리허설', '미팅/상담', '결제/계약', '기타'),
  { nil: null },
);

const scheduleItemArb: fc.Arbitrary<ScheduleFilterItem> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  categoryLabel: categoryLabelArb,
});

const searchQueryArb = fc.string({ minLength: 0, maxLength: 20 });
const nonEmptyQueryArb = fc.string({ minLength: 1, maxLength: 20 });

// ── Property 33: 검색 필터링 정확성 ──────────────────────

describe('Feature: beta-readiness-review, Property 33: 검색 필터링 정확성', () => {
  /**
   * **Validates: Requirements 14.1, 14.2**
   */
  it('should only return items whose title contains the query (case-insensitive)', () => {
    fc.assert(
      fc.property(
        fc.array(searchableItemArb, { minLength: 0, maxLength: 30 }),
        nonEmptyQueryArb,
        (items, query) => {
          const result = filterByTitle(items, query);
          const lowerQuery = query.trim().toLowerCase();

          // 모든 결과 항목의 제목에 쿼리가 포함되어야 함
          for (const item of result) {
            expect(item.title.toLowerCase()).toContain(lowerQuery);
          }

          // 결과에 포함되지 않은 항목은 쿼리를 포함하지 않아야 함
          const resultIds = new Set(result.map((r) => r.id));
          for (const item of items) {
            if (!resultIds.has(item.id)) {
              expect(item.title.toLowerCase()).not.toContain(lowerQuery);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return all items when query is empty', () => {
    fc.assert(
      fc.property(
        fc.array(searchableItemArb, { minLength: 0, maxLength: 20 }),
        (items) => {
          const result = filterByTitle(items, '');
          expect(result.length).toBe(items.length);

          const resultWhitespace = filterByTitle(items, '   ');
          expect(resultWhitespace.length).toBe(items.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should filter schedule items by title or category label', () => {
    fc.assert(
      fc.property(
        fc.array(scheduleItemArb, { minLength: 0, maxLength: 30 }),
        nonEmptyQueryArb,
        (items, query) => {
          const result = filterScheduleItems(items, query);
          const lowerQuery = query.trim().toLowerCase();

          // 모든 결과 항목은 제목 또는 카테고리 라벨에 쿼리를 포함해야 함
          for (const item of result) {
            const titleMatch = item.title.toLowerCase().includes(lowerQuery);
            const categoryMatch = item.categoryLabel
              ? item.categoryLabel.toLowerCase().includes(lowerQuery)
              : false;
            expect(titleMatch || categoryMatch).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 34: 검색어 초기화 ──────────────────────────

describe('Feature: beta-readiness-review, Property 34: 검색어 초기화', () => {
  /**
   * **Validates: Requirements 14.3**
   */
  it('should show clear button when query is non-empty', () => {
    fc.assert(
      fc.property(nonEmptyQueryArb, (query) => {
        expect(shouldShowClearButton(query)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('should hide clear button when query is empty', () => {
    expect(shouldShowClearButton('')).toBe(false);
  });

  it('should reset query to empty string on clear', () => {
    fc.assert(
      fc.property(nonEmptyQueryArb, (_query) => {
        const cleared = clearSearchQuery();
        expect(cleared).toBe('');
        expect(shouldShowClearButton(cleared)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('after clearing, all items should be returned', () => {
    fc.assert(
      fc.property(
        fc.array(searchableItemArb, { minLength: 0, maxLength: 20 }),
        nonEmptyQueryArb,
        (items, query) => {
          // 검색 후 결과 수
          const filtered = filterByTitle(items, query);
          expect(filtered.length).toBeLessThanOrEqual(items.length);

          // 초기화 후 전체 반환
          const cleared = clearSearchQuery();
          const afterClear = filterByTitle(items, cleared);
          expect(afterClear.length).toBe(items.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 35: 완료/미완료 필터 토글 ──────────────────

describe('Feature: beta-readiness-review, Property 35: 완료/미완료 필터 토글', () => {
  /**
   * **Validates: Requirements 14.4**
   */
  it('should only show incomplete items when showCompleted is false', () => {
    fc.assert(
      fc.property(
        fc.array(checklistItemArb, { minLength: 0, maxLength: 30 }),
        (items) => {
          const result = filterByCompletion(items, false);

          // 모든 결과 항목은 is_completed=false
          for (const item of result) {
            expect(item.is_completed).toBe(false);
          }

          // 미완료 항목 수와 일치
          const expectedCount = items.filter((i) => !i.is_completed).length;
          expect(result.length).toBe(expectedCount);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should show all items when showCompleted is true', () => {
    fc.assert(
      fc.property(
        fc.array(checklistItemArb, { minLength: 0, maxLength: 30 }),
        (items) => {
          const result = filterByCompletion(items, true);
          expect(result.length).toBe(items.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should never include completed items when filtering for incomplete', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 20 }),
            is_completed: fc.constant(true),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        (completedItems) => {
          const result = filterByCompletion(completedItems, false);
          expect(result.length).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
