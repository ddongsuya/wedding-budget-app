import { describe, it, expect } from 'vitest';

/**
 * CategoryBudgetProgress component logic tests.
 * Tests the pure calculation logic used by the component.
 */

// Extract the pure logic that the component uses
function calcPercentage(budgetAmount: number, spentAmount: number): number {
  return budgetAmount > 0 ? Math.min((spentAmount / budgetAmount) * 100, 100) : 0;
}

function isOverBudget(budgetAmount: number, spentAmount: number): boolean {
  return spentAmount > budgetAmount && budgetAmount > 0;
}

describe('CategoryBudgetProgress – calculation logic', () => {
  it('calculates percentage correctly for normal spending', () => {
    expect(calcPercentage(1000000, 500000)).toBe(50);
  });

  it('caps percentage at 100 when over budget', () => {
    expect(calcPercentage(1000000, 1500000)).toBe(100);
  });

  it('returns 0 percentage when budget is 0', () => {
    expect(calcPercentage(0, 500000)).toBe(0);
  });

  it('returns 0 percentage when both are 0', () => {
    expect(calcPercentage(0, 0)).toBe(0);
  });

  it('returns 100 when spent equals budget', () => {
    expect(calcPercentage(1000000, 1000000)).toBe(100);
  });

  it('detects over budget correctly', () => {
    expect(isOverBudget(1000000, 1500000)).toBe(true);
  });

  it('not over budget when spent equals budget', () => {
    expect(isOverBudget(1000000, 1000000)).toBe(false);
  });

  it('not over budget when budget is 0', () => {
    expect(isOverBudget(0, 500000)).toBe(false);
  });

  it('not over budget when spent is less', () => {
    expect(isOverBudget(1000000, 500000)).toBe(false);
  });
});
