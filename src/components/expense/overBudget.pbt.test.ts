/**
 * Property-Based Test: 예산 초과 감지 정확성
 * Feature: beta-readiness-review, Property 3: 예산 초과 감지 정확성
 *
 * spentAmount > budgetAmount이고 budgetAmount > 0인 카테고리만 초과로 표시되는지 검증
 *
 * **Validates: Requirements 1.5**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

interface BudgetCategory {
  id: string;
  name: string;
  budgetAmount: number;
  spentAmount: number;
}

/** 예산 초과 카테고리 감지 순수 함수 (Dashboard.tsx의 overBudgetCategories 로직 추출) */
function detectOverBudgetCategories(categories: BudgetCategory[]): BudgetCategory[] {
  return categories.filter(c => c.spentAmount > c.budgetAmount && c.budgetAmount > 0);
}

/** Arbitrary: 예산 카테고리 생성기 */
const categoryArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 10 }),
  budgetAmount: fc.integer({ min: 0, max: 100000000 }),
  spentAmount: fc.integer({ min: 0, max: 100000000 }),
});

/** Arbitrary: 카테고리 배열 생성기 */
const categoriesArb = fc.array(categoryArb, { minLength: 0, maxLength: 15 });

describe('Feature: beta-readiness-review, Property 3: 예산 초과 감지 정확성', () => {
  it('should only flag categories where spentAmount > budgetAmount and budgetAmount > 0', () => {
    fc.assert(
      fc.property(categoriesArb, (categories) => {
        const overBudget = detectOverBudgetCategories(categories);

        // 모든 초과 카테고리는 조건을 만족해야 한다
        for (const cat of overBudget) {
          expect(cat.spentAmount).toBeGreaterThan(cat.budgetAmount);
          expect(cat.budgetAmount).toBeGreaterThan(0);
        }

        // 조건을 만족하는 모든 카테고리가 포함되어야 한다
        const expectedCount = categories.filter(
          c => c.spentAmount > c.budgetAmount && c.budgetAmount > 0
        ).length;
        expect(overBudget.length).toBe(expectedCount);
      }),
      { numRuns: 100 }
    );
  });

  it('should not flag categories with budgetAmount = 0 even if spentAmount > 0', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 10 }),
            budgetAmount: fc.constant(0),
            spentAmount: fc.integer({ min: 1, max: 100000000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (categories) => {
          const overBudget = detectOverBudgetCategories(categories);
          expect(overBudget.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not flag categories where spentAmount <= budgetAmount', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.integer({ min: 1, max: 100000000 }).chain(budget =>
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 10 }),
              budgetAmount: fc.constant(budget),
              spentAmount: fc.integer({ min: 0, max: budget }),
            })
          ),
          { minLength: 1, maxLength: 10 }
        ),
        (categories) => {
          const overBudget = detectOverBudgetCategories(categories);
          expect(overBudget.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
