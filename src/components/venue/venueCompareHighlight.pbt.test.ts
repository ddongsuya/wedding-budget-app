/**
 * Property-Based Test: 식장 비교 최저가/최고가 정확성
 * Feature: beta-readiness-review, Property 14: 식장 비교 최저가/최고가 정확성
 *
 * 하이라이트된 값이 실제 최솟값/최댓값인지 검증
 *
 * **Validates: Requirements 6.2**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getHighlightType, getHighlightMap, type HighlightType } from './venueCompareHighlight';

/** Arbitrary: 비교 대상 값 배열 (최소 2개 식장) */
const valuesArb = fc.array(fc.integer({ min: 0, max: 100000000 }), { minLength: 2, maxLength: 6 });

describe('Feature: beta-readiness-review, Property 14: 식장 비교 최저가/최고가 정확성', () => {
  it('highlighted min should be the actual minimum value', () => {
    fc.assert(
      fc.property(valuesArb, (values) => {
        const actualMin = Math.min(...values);
        const highlights = getHighlightMap(values);

        // 모든 값이 동일하면 하이라이트 없음
        if (new Set(values).size === 1) {
          for (const hl of highlights) {
            expect(hl).toBeNull();
          }
          return;
        }

        // 'min'으로 하이라이트된 인덱스의 값은 실제 최솟값이어야 한다
        for (let i = 0; i < values.length; i++) {
          if (highlights[i] === 'min') {
            expect(values[i]).toBe(actualMin);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('highlighted max should be the actual maximum value', () => {
    fc.assert(
      fc.property(valuesArb, (values) => {
        const actualMax = Math.max(...values);
        const highlights = getHighlightMap(values);

        if (new Set(values).size === 1) return;

        // 'max'로 하이라이트된 인덱스의 값은 실제 최댓값이어야 한다
        for (let i = 0; i < values.length; i++) {
          if (highlights[i] === 'max') {
            expect(values[i]).toBe(actualMax);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('actual min value should be highlighted as min (when distinct)', () => {
    fc.assert(
      fc.property(valuesArb, (values) => {
        const actualMin = Math.min(...values);
        const actualMax = Math.max(...values);

        if (actualMin === actualMax) return; // 모두 동일하면 스킵

        const highlights = getHighlightMap(values);

        // 최솟값을 가진 첫 번째 인덱스는 'min'이어야 한다
        const firstMinIdx = values.indexOf(actualMin);
        expect(highlights[firstMinIdx]).toBe('min');

        // 최댓값을 가진 첫 번째 인덱스는 'max'이어야 한다
        const firstMaxIdx = values.indexOf(actualMax);
        expect(highlights[firstMaxIdx]).toBe('max');
      }),
      { numRuns: 100 }
    );
  });

  it('should return null for single venue', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000000 }),
        (value) => {
          const result = getHighlightType([value], 0);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
