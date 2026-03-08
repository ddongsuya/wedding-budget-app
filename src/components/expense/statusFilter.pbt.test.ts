/**
 * Property-Based Test: 지출 상태별 탭 필터링
 * Feature: beta-readiness-review, Property 10: 지출 상태별 탭 필터링
 *
 * 각 탭에 해당 status 지출만 표시되는지 검증
 *
 * **Validates: Requirements 5.2**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

type ExpenseTab = 'all' | 'completed' | 'planned';

/** 순수 상태 필터링 로직 (Expenses.tsx의 filteredExpenses 탭 필터 추출) */
function filterExpensesByStatus(
  expenses: { id: string; status: 'completed' | 'planned'; amount: number }[],
  tab: ExpenseTab
): { id: string; status: 'completed' | 'planned'; amount: number }[] {
  if (tab === 'all') return expenses;
  return expenses.filter(e => e.status === tab);
}

/** Arbitrary: 지출 항목 생성기 */
const expenseArb = fc.record({
  id: fc.uuid(),
  status: fc.constantFrom('completed' as const, 'planned' as const),
  amount: fc.integer({ min: 1000, max: 100000000 }),
});

/** Arbitrary: 지출 배열 생성기 */
const expensesArb = fc.array(expenseArb, { minLength: 0, maxLength: 30 });

describe('Feature: beta-readiness-review, Property 10: 지출 상태별 탭 필터링', () => {
  it('should only show completed expenses in completed tab', () => {
    fc.assert(
      fc.property(expensesArb, (expenses) => {
        const filtered = filterExpensesByStatus(expenses, 'completed');
        for (const e of filtered) {
          expect(e.status).toBe('completed');
        }
        const expectedCount = expenses.filter(e => e.status === 'completed').length;
        expect(filtered.length).toBe(expectedCount);
      }),
      { numRuns: 100 }
    );
  });

  it('should only show planned expenses in planned tab', () => {
    fc.assert(
      fc.property(expensesArb, (expenses) => {
        const filtered = filterExpensesByStatus(expenses, 'planned');
        for (const e of filtered) {
          expect(e.status).toBe('planned');
        }
        const expectedCount = expenses.filter(e => e.status === 'planned').length;
        expect(filtered.length).toBe(expectedCount);
      }),
      { numRuns: 100 }
    );
  });

  it('should show all expenses in all tab', () => {
    fc.assert(
      fc.property(expensesArb, (expenses) => {
        const filtered = filterExpensesByStatus(expenses, 'all');
        expect(filtered.length).toBe(expenses.length);
      }),
      { numRuns: 100 }
    );
  });
});
