/**
 * Property-Based Test: 체크리스트 연관 데이터 집계 정확성
 * Feature: beta-readiness-review, Property 5: 체크리스트 연관 데이터 집계 정확성
 *
 * 연관 일정 개수와 지출 금액이 실제 데이터와 일치하는지 검증
 *
 * **Validates: Requirements 3.2**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  computeChecklistRelatedSummary,
  computeAllChecklistRelatedSummaries,
  RelatedEvent,
  RelatedExpense,
} from './checklistRelatedData';

const checklistItemIds = ['cl-1', 'cl-2', 'cl-3', 'cl-4', 'cl-5'];

const eventArb: fc.Arbitrary<RelatedEvent> = fc.record({
  id: fc.uuid(),
  checklist_item_id: fc.oneof(
    fc.constantFrom(...checklistItemIds),
    fc.constant(null)
  ),
});

const expenseArb: fc.Arbitrary<RelatedExpense> = fc.record({
  id: fc.uuid(),
  checklist_item_id: fc.oneof(
    fc.constantFrom(...checklistItemIds),
    fc.constant(null)
  ),
  amount: fc.integer({ min: 0, max: 100_000_000 }),
});

describe('Feature: beta-readiness-review, Property 5: 체크리스트 연관 데이터 집계 정확성', () => {
  it('related event count should match the number of events referencing the checklist item', () => {
    fc.assert(
      fc.property(
        fc.array(eventArb, { minLength: 0, maxLength: 30 }),
        fc.array(expenseArb, { minLength: 0, maxLength: 30 }),
        fc.constantFrom(...checklistItemIds),
        (events, expenses, itemId) => {
          const summary = computeChecklistRelatedSummary(itemId, events, expenses);

          // 직접 계산한 기대값
          const expectedEventCount = events.filter(
            (e) => e.checklist_item_id === itemId
          ).length;

          expect(summary.eventCount).toBe(expectedEventCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('related expense total should match the sum of amounts from expenses referencing the checklist item', () => {
    fc.assert(
      fc.property(
        fc.array(eventArb, { minLength: 0, maxLength: 30 }),
        fc.array(expenseArb, { minLength: 0, maxLength: 30 }),
        fc.constantFrom(...checklistItemIds),
        (events, expenses, itemId) => {
          const summary = computeChecklistRelatedSummary(itemId, events, expenses);

          // 직접 계산한 기대값
          const expectedExpenseTotal = expenses
            .filter((e) => e.checklist_item_id === itemId)
            .reduce((sum, e) => sum + e.amount, 0);

          expect(summary.expenseTotal).toBe(expectedExpenseTotal);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('batch computation should produce same results as individual computation for each item', () => {
    fc.assert(
      fc.property(
        fc.array(eventArb, { minLength: 0, maxLength: 30 }),
        fc.array(expenseArb, { minLength: 0, maxLength: 30 }),
        (events, expenses) => {
          const batchResult = computeAllChecklistRelatedSummaries(
            checklistItemIds,
            events,
            expenses
          );

          for (const itemId of checklistItemIds) {
            const individual = computeChecklistRelatedSummary(itemId, events, expenses);
            expect(batchResult[itemId].eventCount).toBe(individual.eventCount);
            expect(batchResult[itemId].expenseTotal).toBe(individual.expenseTotal);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('item with no related data should have zero counts', () => {
    fc.assert(
      fc.property(
        fc.array(eventArb, { minLength: 0, maxLength: 20 }),
        fc.array(expenseArb, { minLength: 0, maxLength: 20 }),
        (events, expenses) => {
          // 'nonexistent' is never in the generated data
          const summary = computeChecklistRelatedSummary('nonexistent', events, expenses);
          expect(summary.eventCount).toBe(0);
          expect(summary.expenseTotal).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
