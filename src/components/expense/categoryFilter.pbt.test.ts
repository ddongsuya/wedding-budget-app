/**
 * Property-Based Test: 카테고리 필터링 정확성
 * Feature: beta-readiness-review, Property 1: 카테고리 필터링 정확성
 *
 * 카테고리 ID로 필터링된 지출 목록이 해당 카테고리만 포함하는지 검증
 *
 * **Validates: Requirements 1.1, 1.4**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/** 순수 카테고리 필터링 로직 (Expenses.tsx의 filteredExpenses 로직 추출) */
function filterExpensesByCategory(
  expenses: { id: string; categoryId: string; title: string; amount: number }[],
  categoryId: string
): { id: string; categoryId: string; title: string; amount: number }[] {
  if (categoryId === 'all') return expenses;
  return expenses.filter(e => e.categoryId === categoryId);
}

/** Arbitrary: 지출 항목 생성기 */
const expenseArb = fc.record({
  id: fc.uuid(),
  categoryId: fc.constantFrom('1', '2', '3', '4', '5'),
  title: fc.string({ minLength: 1, maxLength: 30 }),
  amount: fc.integer({ min: 1000, max: 100000000 }),
});

/** Arbitrary: 지출 배열 생성기 */
const expensesArb = fc.array(expenseArb, { minLength: 0, maxLength: 20 });

/** Arbitrary: 카테고리 ID 생성기 */
const categoryIdArb = fc.constantFrom('1', '2', '3', '4', '5');

describe('Feature: beta-readiness-review, Property 1: 카테고리 필터링 정확성', () => {
  it('should only contain expenses matching the filtered category ID', () => {
    fc.assert(
      fc.property(expensesArb, categoryIdArb, (expenses, categoryId) => {
        const filtered = filterExpensesByCategory(expenses, categoryId);

        // 모든 필터링된 항목은 해당 카테고리에 속해야 한다
        for (const expense of filtered) {
          expect(expense.categoryId).toBe(categoryId);
        }

        // 필터링된 항목 수는 원본에서 해당 카테고리 항목 수와 동일해야 한다
        const expectedCount = expenses.filter(e => e.categoryId === categoryId).length;
        expect(filtered.length).toBe(expectedCount);
      }),
      { numRuns: 100 }
    );
  });

  it('should return all expenses when category is "all"', () => {
    fc.assert(
      fc.property(expensesArb, (expenses) => {
        const filtered = filterExpensesByCategory(expenses, 'all');
        expect(filtered.length).toBe(expenses.length);
      }),
      { numRuns: 100 }
    );
  });

  it('should return empty array when no expenses match the category', () => {
    fc.assert(
      fc.property(expensesArb, (expenses) => {
        // 카테고리 '99'는 생성기에 없으므로 항상 빈 배열
        const filtered = filterExpensesByCategory(expenses, '99');
        expect(filtered.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});
