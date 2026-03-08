/**
 * Property-Based Test: 방문일 기준 정렬 정확성
 * Feature: beta-readiness-review, Property 15: 방문일 기준 정렬 정확성
 *
 * 방문일 기준 정렬 시 올바른 순서 검증
 *
 * **Validates: Requirements 6.4**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { sortVenuesByVisitDateAsc, sortVenuesByVisitDateDesc, type VenueForSort } from './venueVisitDateSort';

/** Arbitrary: 날짜 문자열 생성기 (YYYY-MM-DD) */
const dateArb = fc.tuple(
  fc.integer({ min: 2024, max: 2026 }),
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 1, max: 28 }),
).map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

/** Arbitrary: 방문일 (null 가능) */
const visitDateArb = fc.oneof(dateArb, fc.constant(null));

/** Arbitrary: 식장 생성기 */
const venueArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  visitDate: visitDateArb,
});

/** Arbitrary: 식장 배열 */
const venuesArb = fc.array(venueArb, { minLength: 0, maxLength: 20 });

describe('Feature: beta-readiness-review, Property 15: 방문일 기준 정렬 정확성', () => {
  it('ascending sort should produce non-decreasing visit dates', () => {
    fc.assert(
      fc.property(venuesArb, (venues) => {
        const sorted = sortVenuesByVisitDateAsc(venues);

        // 연속된 두 항목의 방문일이 오름차순이어야 한다
        for (let i = 0; i < sorted.length - 1; i++) {
          const dateA = sorted[i].visitDate || '9999-12-31';
          const dateB = sorted[i + 1].visitDate || '9999-12-31';
          expect(dateA <= dateB).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('descending sort should produce non-increasing visit dates', () => {
    fc.assert(
      fc.property(venuesArb, (venues) => {
        const sorted = sortVenuesByVisitDateDesc(venues);

        for (let i = 0; i < sorted.length - 1; i++) {
          const dateA = sorted[i].visitDate || '0000-01-01';
          const dateB = sorted[i + 1].visitDate || '0000-01-01';
          expect(dateA >= dateB).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('sort should preserve all elements (no data loss)', () => {
    fc.assert(
      fc.property(venuesArb, (venues) => {
        const sorted = sortVenuesByVisitDateAsc(venues);

        expect(sorted.length).toBe(venues.length);

        // 모든 원본 ID가 정렬 결과에 존재해야 한다
        const originalIds = new Set(venues.map(v => v.id));
        const sortedIds = new Set(sorted.map(v => v.id));
        expect(sortedIds).toEqual(originalIds);
      }),
      { numRuns: 100 }
    );
  });

  it('venues with null visitDate should be at the end in ascending sort', () => {
    fc.assert(
      fc.property(venuesArb, (venues) => {
        const sorted = sortVenuesByVisitDateAsc(venues);
        const withDate = sorted.filter(v => v.visitDate !== null);
        const withoutDate = sorted.filter(v => v.visitDate === null);

        // null 방문일 항목은 모두 뒤에 있어야 한다
        if (withDate.length > 0 && withoutDate.length > 0) {
          const lastWithDateIdx = sorted.lastIndexOf(withDate[withDate.length - 1]);
          const firstWithoutDateIdx = sorted.indexOf(withoutDate[0]);
          expect(lastWithDateIdx).toBeLessThan(firstWithoutDateIdx);
        }
      }),
      { numRuns: 100 }
    );
  });
});
