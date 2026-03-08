/**
 * Property-Based Tests: 기능 팁 첫 방문 표시
 * Feature: beta-readiness-review
 *
 * Property 37: 기능 팁 첫 방문 표시 - 첫 방문 시 팁 표시, 이후 방문 시 미표시 검증
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { shouldShowFeatureTip } from './featureTipLogic';

// ── Arbitraries ──────────────────────────────────────────

const pageKeyArb = fc.constantFrom(
  'dashboard', 'budget', 'expenses', 'checklist', 'venues', 'schedule', 'photos',
);

const visitedPagesArb = fc.subarray(
  ['dashboard', 'budget', 'expenses', 'checklist', 'venues', 'schedule', 'photos'],
);

describe('Feature: beta-readiness-review, Property 37: 기능 팁 첫 방문 표시', () => {
  /**
   * **Validates: Requirements 15.4**
   */
  it('should show tip when page has not been visited', () => {
    fc.assert(
      fc.property(
        pageKeyArb,
        visitedPagesArb,
        (pageKey, visitedPages) => {
          const notVisited = visitedPages.filter((p) => p !== pageKey);
          expect(shouldShowFeatureTip(pageKey, notVisited)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should not show tip when page has already been visited', () => {
    fc.assert(
      fc.property(
        pageKeyArb,
        visitedPagesArb,
        (pageKey, visitedPages) => {
          const withVisited = visitedPages.includes(pageKey)
            ? visitedPages
            : [...visitedPages, pageKey];
          expect(shouldShowFeatureTip(pageKey, withVisited)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should show tip only for unvisited pages in a set', () => {
    fc.assert(
      fc.property(
        visitedPagesArb,
        (visitedPages) => {
          const allPages = ['dashboard', 'budget', 'expenses', 'checklist', 'venues', 'schedule', 'photos'];
          for (const page of allPages) {
            const result = shouldShowFeatureTip(page, visitedPages);
            if (visitedPages.includes(page)) {
              expect(result).toBe(false);
            } else {
              expect(result).toBe(true);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
