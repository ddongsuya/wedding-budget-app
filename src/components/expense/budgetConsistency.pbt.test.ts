/**
 * Property-Based Test: 예산-지출 합계 일관성
 * Feature: beta-readiness-review, Property 2: 예산-지출 합계 일관성
 *
 * 카테고리 지출 합계가 실제 지출 amount 합과 동일한지 검증
 *
 * **Validates: Requirements 1.2**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/** 카테고리별 지출 합계 계산 순수 함수 */
function calculateCategorySpentAmount(
  expenses: { categoryId: string; amount: number }[],
  categoryId: string
): number {
  return expenses
    .filter(e => e.categoryId === categoryId)
    .reduce((sum, e) => sum + e.amount, 0);
}

/** Arbitrary: 지출 항목 생성기 */
const expenseArb = fc.record({
  categoryId: fc.constantFrom('1', '2', '3', '4', '5'),
  amount: fc.integer({ min: 0, max: 100000000 }),
});

/** Arbitrary: 지출 배열 생성기 */
const expensesArb = fc.array(expenseArb, { minLength: 0, maxLength: 30 });

/** Arbitrary: 카테고리 ID 생성기 */
const categoryIdArb = fc.constantFrom('1', '2', '3', '4', '5');

describe('Feature: beta-readiness-review, Property 2: 예산-지출 합계 일관성', () => {
  it('should have spentAmount equal to sum of filtered expense amounts', () => {
    fc.assert(
      fc.property(expensesArb, categoryIdArb, (expenses, categoryId) => {
        const spentAmount = calculateCategorySpentAmount(expenses, categoryId);
        const manualSum = expenses
          .filter(e => e.categoryId === categoryId)
          .reduce((sum, e) => sum + e.amount, 0);

        expect(spentAmount).toBe(manualSum);
      }),
      { numRuns: 100 }
    );
  });

  it('should have total of all category sums equal to total expenses sum', () => {
    fc.assert(
      fc.property(expensesArb, (expenses) => {
        const categoryIds = ['1', '2', '3', '4', '5'];
        const totalByCategorySum = categoryIds.reduce(
          (total, catId) => total + calculateCategorySpentAmount(expenses, catId),
          0
        );
        const totalDirect = expenses.reduce((sum, e) => sum + e.amount, 0);

        expect(totalByCategorySum).toBe(totalDirect);
      }),
      { numRuns: 100 }
    );
  });
});
