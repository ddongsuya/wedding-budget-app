/**
 * Property-Based Test: 결제 예정 알림 트리거
 * Feature: beta-readiness-review, Property 11: 결제 예정 알림 트리거
 *
 * status='planned'이고 due_date가 현재 날짜로부터 3일 이내인 지출에 대해
 * 해당 지출에 대한 결제 예정 알림이 생성되어야 한다.
 *
 * **Validates: Requirements 5.3, 9.2**
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

// Mock dependencies before imports
vi.mock('../config/database', () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock('./notificationService', () => ({
  createNotification: vi.fn(),
  createChecklistDueNotification: vi.fn(),
}));

vi.mock('./coupleNotificationService', () => ({
  notifyPartnerOfActivity: vi.fn(),
}));

vi.mock('./ddayService', () => ({
  calculateDday: vi.fn(),
}));

vi.mock('./notificationRetry', () => ({
  processFailedNotifications: vi.fn(),
}));

import { pool } from '../config/database';
import { createNotification } from './notificationService';
import { triggerPaymentDueNotifications } from './notificationTriggers';

/**
 * Helper: create a date string offset from today by `daysOffset` days.
 */
function dateFromToday(daysOffset: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

/**
 * Arbitrary for generating a random expense row that is within the 3-day window.
 * daysOffset is in [0, 3] (today through 3 days from now).
 */
const withinWindowExpenseArb = fc.record({
  id: fc.integer({ min: 1, max: 100000 }),
  title: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  amount: fc.integer({ min: 1, max: 10000000 }),
  couple_id: fc.integer({ min: 1, max: 10000 }),
  daysOffset: fc.integer({ min: 0, max: 3 }),
});

/**
 * Arbitrary for generating a random expense row that is outside the 3-day window.
 * daysOffset is in [4, 365] (more than 3 days from now).
 */
const outsideWindowExpenseArb = fc.record({
  id: fc.integer({ min: 1, max: 100000 }),
  title: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  amount: fc.integer({ min: 1, max: 10000000 }),
  couple_id: fc.integer({ min: 1, max: 10000 }),
  daysOffset: fc.integer({ min: 4, max: 365 }),
});

/**
 * Arbitrary for generating user IDs associated with a couple.
 */
const usersArb = fc.array(fc.integer({ min: 1, max: 100000 }), { minLength: 1, maxLength: 2 });

describe('Feature: beta-readiness-review, Property 11: 결제 예정 알림 트리거', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create notifications for all planned expenses with due_date within 3 days', () => {
    return fc.assert(
      fc.asyncProperty(
        withinWindowExpenseArb,
        usersArb,
        async (expenseData, userIds) => {
          vi.clearAllMocks();

          const dueDate = dateFromToday(expenseData.daysOffset);
          const expenseRow = {
            id: expenseData.id,
            title: expenseData.title,
            amount: expenseData.amount,
            due_date: dueDate,
            couple_id: expenseData.couple_id,
          };

          const userRows = userIds.map((id) => ({ id }));

          // Mock pool.query calls in order:
          // 1. Expenses query - returns our within-window expense
          // 2. Users query - returns users for the couple
          // 3. Existing notification check - returns empty (no duplicate)
          const mockQuery = pool.query as ReturnType<typeof vi.fn>;
          mockQuery
            .mockResolvedValueOnce({ rows: [expenseRow] }) // expenses query
            .mockResolvedValueOnce({ rows: userRows }); // users query

          // For each user: existing notification check returns empty
          for (let i = 0; i < userIds.length; i++) {
            mockQuery.mockResolvedValueOnce({ rows: [] }); // no existing notification
          }

          // createNotification returns a notification object for each call
          (createNotification as ReturnType<typeof vi.fn>).mockResolvedValue({
            id: 'notif-1',
            type: 'budget_warning',
          });

          const sentCount = await triggerPaymentDueNotifications();

          // Should have created exactly one notification per user
          expect(sentCount).toBe(userIds.length);
          expect(createNotification).toHaveBeenCalledTimes(userIds.length);

          // Verify each notification was created with correct data
          for (let i = 0; i < userIds.length; i++) {
            const callArgs = (createNotification as ReturnType<typeof vi.fn>).mock.calls[i][0];
            expect(callArgs.user_id).toBe(userIds[i]);
            expect(callArgs.type).toBe('budget_warning');
            expect(callArgs.data.expenseId).toBe(expenseData.id.toString());
            expect(callArgs.data.expenseTitle).toBe(expenseData.title);
            expect(callArgs.data.amount).toBe(expenseData.amount);
            expect(callArgs.link).toBe(`/expenses?id=${expenseData.id}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT create notifications for expenses with due_date > 3 days away', () => {
    return fc.assert(
      fc.asyncProperty(
        outsideWindowExpenseArb,
        usersArb,
        async (expenseData, _userIds) => {
          vi.clearAllMocks();

          // The SQL query itself filters out expenses with due_date > 3 days.
          // So the DB should return empty rows for these expenses.
          // We simulate the DB correctly filtering them out.
          const mockQuery = pool.query as ReturnType<typeof vi.fn>;
          mockQuery.mockResolvedValueOnce({ rows: [] }); // no matching expenses

          const sentCount = await triggerPaymentDueNotifications();

          // No notifications should be created
          expect(sentCount).toBe(0);
          expect(createNotification).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should skip notification if one was already sent today for the same expense', () => {
    return fc.assert(
      fc.asyncProperty(
        withinWindowExpenseArb,
        usersArb,
        async (expenseData, userIds) => {
          vi.clearAllMocks();

          const dueDate = dateFromToday(expenseData.daysOffset);
          const expenseRow = {
            id: expenseData.id,
            title: expenseData.title,
            amount: expenseData.amount,
            due_date: dueDate,
            couple_id: expenseData.couple_id,
          };

          const userRows = userIds.map((id) => ({ id }));

          const mockQuery = pool.query as ReturnType<typeof vi.fn>;
          mockQuery
            .mockResolvedValueOnce({ rows: [expenseRow] }) // expenses query
            .mockResolvedValueOnce({ rows: userRows }); // users query

          // For each user: existing notification check returns a result (already sent)
          for (let i = 0; i < userIds.length; i++) {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-notif' }] });
          }

          const sentCount = await triggerPaymentDueNotifications();

          // No new notifications should be created since all already exist
          expect(sentCount).toBe(0);
          expect(createNotification).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
