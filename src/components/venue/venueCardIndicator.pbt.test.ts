/**
 * Property-Based Test: 식장 카드 인디케이터 정확성
 * Feature: beta-readiness-review, Property 13: 식장 카드 인디케이터 정확성
 *
 * "i/N" 형식 표시 및 1 ≤ i ≤ N 검증
 *
 * **Validates: Requirements 6.1**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getCardIndicatorText, isValidCardIndicator } from './venueCardIndicator';

describe('Feature: beta-readiness-review, Property 13: 식장 카드 인디케이터 정확성', () => {
  it('should display "i/N" format where 1 ≤ i ≤ N', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // totalCount (N)
        (totalCount) => {
          // 모든 유효한 인덱스에 대해 검증
          for (let idx = 0; idx < totalCount; idx++) {
            const text = getCardIndicatorText(idx, totalCount);
            const displayIndex = idx + 1;

            // "i / N" 형식이어야 한다
            expect(text).toBe(`${displayIndex} / ${totalCount}`);

            // 1 ≤ i ≤ N 이어야 한다
            expect(displayIndex).toBeGreaterThanOrEqual(1);
            expect(displayIndex).toBeLessThanOrEqual(totalCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate indicator bounds correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 0, max: 49 }),
        (totalCount, rawIndex) => {
          const index = rawIndex % totalCount; // 유효 범위 내 인덱스

          expect(isValidCardIndicator(index, totalCount)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return false for invalid totalCount', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        (index) => {
          expect(isValidCardIndicator(index, 0)).toBe(false);
          expect(isValidCardIndicator(index, -1)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
