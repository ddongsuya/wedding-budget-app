/**
 * Property-Based Tests: 대시보드 필터링 유틸리티
 * Feature: beta-readiness-review
 *
 * Property 6: 대시보드 다가오는 일정 제한 - 최대 3개, 날짜 오름차순 정렬 검증
 * Property 7: 대시보드 결제 예정 필터링 - status='planned'인 지출만 표시
 * Property 8: 대시보드 마감 임박 체크리스트 정확성 - 미완료이고 D-day에 가장 가까운 항목
 * Property 21: 커플 파트너 활동 알림 - 파트너 데이터 변경 시 알림 생성
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  getUpcomingEvents,
  getPlannedExpenses,
  getUrgentChecklist,
  generatePartnerActivityNotification,
  duePeriodToDays,
  type DashboardEvent,
  type DashboardExpense,
  type DashboardChecklistItem,
  type PartnerActivityInput,
} from './dashboardFilters';
import type { DuePeriod } from '@/types/checklist';

// ── Arbitraries ──────────────────────────────────────────

const isoDateArb = fc
  .integer({ min: 2024, max: 2027 })
  .chain((year) =>
    fc.integer({ min: 1, max: 12 }).chain((month) =>
      fc.integer({ min: 1, max: 28 }).map((day) => {
        const m = String(month).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
      }),
    ),
  );

const eventArb: fc.Arbitrary<DashboardEvent> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 20 }),
  date: isoDateArb,
});

const statusArb = fc.constantFrom('planned' as const, 'completed' as const);

const expenseArb: fc.Arbitrary<DashboardExpense> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 20 }),
  amount: fc.integer({ min: 0, max: 100_000_000 }),
  status: statusArb,
  dueDate: fc.option(isoDateArb, { nil: null }),
});

const duePeriodArb: fc.Arbitrary<DuePeriod> = fc.constantFrom(
  'D-180', 'D-150', 'D-120', 'D-90', 'D-60', 'D-30', 'D-14', 'D-7', 'D-1', 'D-DAY', 'AFTER',
);

const checklistItemArb: fc.Arbitrary<DashboardChecklistItem> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 20 }),
  is_completed: fc.boolean(),
  due_period: fc.option(duePeriodArb, { nil: null }),
});

// ── Property 6: 대시보드 다가오는 일정 제한 ──────────────

describe('Feature: beta-readiness-review, Property 6: 대시보드 다가오는 일정 제한', () => {
  /**
   * **Validates: Requirements 4.1**
   */
  it('should return at most 3 events sorted by date ascending', () => {
    fc.assert(
      fc.property(
        fc.array(eventArb, { minLength: 0, maxLength: 20 }),
        (events) => {
          const result = getUpcomingEvents(events);

          // 최대 3개
          expect(result.length).toBeLessThanOrEqual(3);

          // 원본보다 많을 수 없음
          expect(result.length).toBeLessThanOrEqual(events.length);

          // 날짜 오름차순 정렬
          for (let i = 1; i < result.length; i++) {
            expect(new Date(result[i].date).getTime())
              .toBeGreaterThanOrEqual(new Date(result[i - 1].date).getTime());
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return the earliest events from the list', () => {
    fc.assert(
      fc.property(
        fc.array(eventArb, { minLength: 4, maxLength: 20 }),
        (events) => {
          const result = getUpcomingEvents(events);
          const allSorted = [...events].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );

          // 반환된 이벤트는 전체 정렬 목록의 처음 3개와 동일해야 함
          expect(result.length).toBe(3);
          for (let i = 0; i < 3; i++) {
            expect(result[i].id).toBe(allSorted[i].id);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 7: 대시보드 결제 예정 필터링 ──────────────

describe('Feature: beta-readiness-review, Property 7: 대시보드 결제 예정 필터링', () => {
  /**
   * **Validates: Requirements 4.2**
   */
  it('should only include expenses with status=planned', () => {
    fc.assert(
      fc.property(
        fc.array(expenseArb, { minLength: 0, maxLength: 20 }),
        (expenses) => {
          const result = getPlannedExpenses(expenses);

          // 모든 결과는 status=planned
          for (const e of result) {
            expect(e.status).toBe('planned');
          }

          // planned인 모든 항목이 포함되어야 함
          const expectedCount = expenses.filter((e) => e.status === 'planned').length;
          expect(result.length).toBe(expectedCount);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should never include completed expenses', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 20 }),
            amount: fc.integer({ min: 0, max: 100_000_000 }),
            status: fc.constant('completed' as const),
            dueDate: fc.option(isoDateArb, { nil: null }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        (completedExpenses) => {
          const result = getPlannedExpenses(completedExpenses);
          expect(result.length).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 8: 대시보드 마감 임박 체크리스트 정확성 ──────

describe('Feature: beta-readiness-review, Property 8: 대시보드 마감 임박 체크리스트 정확성', () => {
  /**
   * **Validates: Requirements 4.3**
   */
  it('should only include incomplete items with a due_period', () => {
    fc.assert(
      fc.property(
        fc.array(checklistItemArb, { minLength: 0, maxLength: 20 }),
        fc.integer({ min: 0, max: 365 }),
        (items, daysUntilWedding) => {
          const result = getUrgentChecklist(items, daysUntilWedding);

          // 최대 3개
          expect(result.length).toBeLessThanOrEqual(3);

          // 모든 결과는 미완료이고 due_period가 있어야 함
          for (const item of result) {
            expect(item.is_completed).toBe(false);
            expect(item.due_period).not.toBeNull();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return items closest to current D-day first', () => {
    fc.assert(
      fc.property(
        fc.array(checklistItemArb, { minLength: 0, maxLength: 20 }),
        fc.integer({ min: 0, max: 365 }),
        (items, daysUntilWedding) => {
          const result = getUrgentChecklist(items, daysUntilWedding);

          // 결과가 D-day 차이 오름차순으로 정렬되어 있는지 확인
          for (let i = 1; i < result.length; i++) {
            const prevDiff = Math.abs(duePeriodToDays(result[i - 1].due_period!) - daysUntilWedding);
            const currDiff = Math.abs(duePeriodToDays(result[i].due_period!) - daysUntilWedding);
            expect(currDiff).toBeGreaterThanOrEqual(prevDiff);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should never include completed items', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 20 }),
            is_completed: fc.constant(true),
            due_period: fc.option(duePeriodArb, { nil: null }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        fc.integer({ min: 0, max: 365 }),
        (completedItems, daysUntilWedding) => {
          const result = getUrgentChecklist(completedItems, daysUntilWedding);
          expect(result.length).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 21: 커플 파트너 활동 알림 ──────────────────

describe('Feature: beta-readiness-review, Property 21: 커플 파트너 활동 알림', () => {
  const activityTypeArb = fc.constantFrom('expense' as const, 'checklist' as const);
  const actionArb = fc.constantFrom('add' as const, 'update' as const, 'delete' as const);

  const activityInputArb: fc.Arbitrary<PartnerActivityInput> = fc.record({
    actorUserId: fc.uuid(),
    coupleId: fc.uuid(),
    activityType: activityTypeArb,
    action: actionArb,
    itemName: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  });

  /**
   * **Validates: Requirements 9.3**
   */
  it('should generate notification when partner exists', () => {
    fc.assert(
      fc.property(
        activityInputArb,
        fc.uuid(), // partnerUserId
        (input, partnerUserId) => {
          const result = generatePartnerActivityNotification(input, partnerUserId);

          expect(result).not.toBeNull();
          expect(result!.targetUserId).toBe(partnerUserId);
          expect(result!.actorUserId).toBe(input.actorUserId);
          expect(result!.coupleId).toBe(input.coupleId);
          expect(result!.activityType).toBe(input.activityType);
          expect(result!.action).toBe(input.action);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return null when no partner exists', () => {
    fc.assert(
      fc.property(activityInputArb, (input) => {
        const result = generatePartnerActivityNotification(input, null);
        expect(result).toBeNull();
      }),
      { numRuns: 100 },
    );
  });

  it('should always target the partner, never the actor', () => {
    fc.assert(
      fc.property(
        activityInputArb,
        fc.uuid(),
        (input, partnerUserId) => {
          const result = generatePartnerActivityNotification(input, partnerUserId);
          if (result) {
            expect(result.targetUserId).not.toBe(result.actorUserId);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
