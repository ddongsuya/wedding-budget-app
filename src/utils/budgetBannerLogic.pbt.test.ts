/**
 * Property-Based Tests: 예산 미설정 안내 배너
 * Feature: beta-readiness-review
 *
 * Property 36: 예산 미설정 안내 배너 - totalBudget=0이면 배너 표시, 0보다 크면 미표시 검증
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { shouldShowBudgetBanner } from './budgetBannerLogic';

describe('Feature: beta-readiness-review, Property 36: 예산 미설정 안내 배너', () => {
  /**
   * **Validates: Requirements 15.2**
   */
  it('should show banner when totalBudget is 0', () => {
    expect(shouldShowBudgetBanner(0)).toBe(true);
  });

  it('should not show banner when totalBudget is greater than 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000_000 }),
        (totalBudget) => {
          expect(shouldShowBudgetBanner(totalBudget)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should show banner only when totalBudget equals exactly 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000_000 }),
        (totalBudget) => {
          const result = shouldShowBudgetBanner(totalBudget);
          if (totalBudget === 0) {
            expect(result).toBe(true);
          } else {
            expect(result).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
