/**
 * Property-Based Test: 월별 지출 집계 정확성
 * Feature: beta-readiness-review, Property 9: 월별 지출 집계 정확성
 *
 * 월별 차트 합계가 해당 월 지출 amount 합과 동일한지 검증
 *
 * **Validates: Requirements 5.1**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { aggregateMonthlyExpenses } from './MonthlyExpenseChart';

/** Arbitrary: 최근 6개월 내 날짜 문자열 생성기 */
const recentDateArb = fc.integer({ min: 0, max: 5 }).chain((monthsAgo) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() - monthsAgo;
  const d = new Date(year, month, 1);
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return fc.integer({ min: 1, max: daysInMonth }).map((day) => {
    const m = d.getMonth() + 1;
    return `${d.getFullYear()}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });
});

/** Arbitrary: 지출 항목 생성기 */
const expenseArb = fc.record({
  paymentDate: recentDateArb,
  amount: fc.integer({ min: 1000, max: 50000000 }),
});

/** Arbitrary: 지출 배열 생성기 */
const expensesArb = fc.array(expenseArb, { minLength: 0, maxLength: 30 });

describe('Feature: beta-readiness-review, Property 9: 월별 지출 집계 정확성', () => {
  it('should have each month total equal to sum of expenses in that month', () => {
    fc.assert(
      fc.property(expensesArb, (expenses) => {
        const aggregated = aggregateMonthlyExpenses(expenses, 6);

        for (const monthData of aggregated) {
          const [yearStr, monthStr] = monthData.month.split('-');
          const year = parseInt(yearStr);
          const month = parseInt(monthStr);

          const expectedTotal = expenses
            .filter(e => {
              const d = new Date(e.paymentDate);
              return d.getFullYear() === year && d.getMonth() + 1 === month;
            })
            .reduce((sum, e) => sum + e.amount, 0);

          expect(monthData.total).toBe(expectedTotal);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should always return exactly the requested number of months', () => {
    fc.assert(
      fc.property(expensesArb, fc.integer({ min: 1, max: 12 }), (expenses, months) => {
        const aggregated = aggregateMonthlyExpenses(expenses, months);
        expect(aggregated.length).toBe(months);
      }),
      { numRuns: 100 }
    );
  });
});
