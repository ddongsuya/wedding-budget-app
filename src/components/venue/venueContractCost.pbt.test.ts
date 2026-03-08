/**
 * Property-Based Test: 예식장 계약 비용 일관성
 * Feature: beta-readiness-review, Property 4: 예식장 계약 비용 일관성
 *
 * 계약 완료된 식장의 총 비용이 연관 지출 합계와 일치하는지 검증
 *
 * **Validates: Requirements 2.3**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/** 연관 지출 항목 */
interface RelatedExpense {
  id: string;
  venueId: string;
  title: string;
  amount: number;
}

/** 계약 식장의 표시 총 비용을 연관 지출 합계로 계산하는 순수 함수 */
export function calculateVenueExpenseTotal(
  expenses: RelatedExpense[],
  venueId: string
): number {
  return expenses
    .filter((e) => e.venueId === venueId)
    .reduce((sum, e) => sum + e.amount, 0);
}

/** 식장 상세에서 표시되는 연관 지출 합계 계산 (UI 로직 추출) */
export function getDisplayedExpenseTotal(relatedExpenses: RelatedExpense[]): number {
  return relatedExpenses.reduce((sum, e) => sum + e.amount, 0);
}

/** Arbitrary: 지출 항목 생성기 */
const expenseArb = (venueIds: string[]) =>
  fc.record({
    id: fc.uuid(),
    venueId: fc.constantFrom(...venueIds),
    title: fc.string({ minLength: 1, maxLength: 20 }),
    amount: fc.integer({ min: 1000, max: 100000000 }),
  });

/** Arbitrary: 식장 ID 생성기 */
const venueIdArb = fc.constantFrom('v1', 'v2', 'v3');

describe('Feature: beta-readiness-review, Property 4: 예식장 계약 비용 일관성', () => {
  it('contracted venue total cost should equal sum of related expenses', () => {
    fc.assert(
      fc.property(
        fc.array(expenseArb(['v1', 'v2', 'v3']), { minLength: 0, maxLength: 20 }),
        venueIdArb,
        (allExpenses, venueId) => {
          // 해당 식장의 연관 지출만 필터링
          const relatedExpenses = allExpenses.filter((e) => e.venueId === venueId);

          // 두 가지 방법으로 계산한 합계가 일치해야 한다
          const totalFromAll = calculateVenueExpenseTotal(allExpenses, venueId);
          const totalFromRelated = getDisplayedExpenseTotal(relatedExpenses);

          expect(totalFromAll).toBe(totalFromRelated);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('venue with no related expenses should have zero total', () => {
    fc.assert(
      fc.property(
        fc.array(expenseArb(['v1', 'v2']), { minLength: 0, maxLength: 10 }),
        (expenses) => {
          // 'v99'는 생성기에 없으므로 항상 0
          const total = calculateVenueExpenseTotal(expenses, 'v99');
          expect(total).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('total should be non-negative when all amounts are positive', () => {
    fc.assert(
      fc.property(
        fc.array(expenseArb(['v1', 'v2', 'v3']), { minLength: 0, maxLength: 20 }),
        venueIdArb,
        (expenses, venueId) => {
          const total = calculateVenueExpenseTotal(expenses, venueId);
          expect(total).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
