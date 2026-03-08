/**
 * Property-Based Test: 체크리스트 마감 알림 트리거
 * Feature: beta-readiness-review, Property 20: 체크리스트 마감 알림 트리거
 *
 * due_period가 현재 D-day와 일치하는 미완료 항목에 대해 알림 생성 검증
 *
 * **Validates: Requirements 9.1**
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
import { createChecklistDueNotification } from './notificationService';
import { calculateDday } from './ddayService';
import { triggerChecklistDeadlineNotifications } from './notificationTriggers';

/**
 * Arbitrary: couple with a future wedding date and a computed daysLeft value.
 */
const coupleArb = fc.record({
  couple_id: fc.integer({ min: 1, max: 10000 }),
  daysLeft: fc.integer({ min: 0, max: 365 }),
});

/**
 * Arbitrary: checklist item with a due_period string and title.
 */
const checklistItemArb = fc.record({
  id: fc.integer({ min: 1, max: 100000 }),
  title: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  due_date: fc.constant('2025-12-31'),
});

/**
 * Arbitrary: user IDs for a couple (1 or 2 users).
 */
const usersArb = fc.array(fc.integer({ min: 1, max: 100000 }), { minLength: 1, maxLength: 2 });

describe('Feature: beta-readiness-review, Property 20: 체크리스트 마감 알림 트리거', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create notifications for checklist items whose due_period matches current D-day', () => {
    return fc.assert(
      fc.asyncProperty(
        coupleArb,
        checklistItemArb,
        usersArb,
        async (couple, item, userIds) => {
          vi.clearAllMocks();

          const matchingDuePeriod = `D-${couple.daysLeft}`;
          const weddingDate = new Date();
          weddingDate.setDate(weddingDate.getDate() + couple.daysLeft);
          const weddingDateStr = weddingDate.toISOString().split('T')[0];

          // Mock calculateDday to return the couple's daysLeft
          (calculateDday as ReturnType<typeof vi.fn>).mockReturnValue(couple.daysLeft);

          const mockQuery = pool.query as ReturnType<typeof vi.fn>;

          // 1. Couples query - returns our couple with wedding_date
          mockQuery.mockResolvedValueOnce({
            rows: [{ couple_id: couple.couple_id, wedding_date: weddingDateStr }],
          });

          // 2. Checklist items query - returns item with matching due_period
          const itemRow = {
            id: item.id,
            title: item.title,
            due_period: matchingDuePeriod,
            due_date: item.due_date,
          };
          mockQuery.mockResolvedValueOnce({ rows: [itemRow] });

          // 3. Users query - returns users for the couple
          const userRows = userIds.map((id) => ({ id }));
          mockQuery.mockResolvedValueOnce({ rows: userRows });

          // 4. For each user: existing notification check returns empty (no duplicate)
          for (let i = 0; i < userIds.length; i++) {
            mockQuery.mockResolvedValueOnce({ rows: [] });
          }

          // Mock createChecklistDueNotification to return a notification
          (createChecklistDueNotification as ReturnType<typeof vi.fn>).mockResolvedValue({
            id: 'notif-1',
            type: 'checklist_due',
          });

          const sentCount = await triggerChecklistDeadlineNotifications();

          // Should create exactly one notification per user
          expect(sentCount).toBe(userIds.length);
          expect(createChecklistDueNotification).toHaveBeenCalledTimes(userIds.length);

          // Verify each call was made with correct parameters
          for (let i = 0; i < userIds.length; i++) {
            expect(createChecklistDueNotification).toHaveBeenCalledWith(
              userIds[i],
              item.title,
              expect.any(String),
              false
            );
          }

          // Verify the checklist items query used the correct due_period
          const checklistQuery = mockQuery.mock.calls[1];
          expect(checklistQuery[1]).toContain(matchingDuePeriod);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT create notifications for items with non-matching due_period', () => {
    return fc.assert(
      fc.asyncProperty(
        coupleArb,
        usersArb,
        async (couple, _userIds) => {
          vi.clearAllMocks();

          const weddingDate = new Date();
          weddingDate.setDate(weddingDate.getDate() + couple.daysLeft);
          const weddingDateStr = weddingDate.toISOString().split('T')[0];

          // Mock calculateDday to return the couple's daysLeft
          (calculateDday as ReturnType<typeof vi.fn>).mockReturnValue(couple.daysLeft);

          const mockQuery = pool.query as ReturnType<typeof vi.fn>;

          // 1. Couples query - returns our couple
          mockQuery.mockResolvedValueOnce({
            rows: [{ couple_id: couple.couple_id, wedding_date: weddingDateStr }],
          });

          // 2. Checklist items query - returns empty (no items match current D-day)
          // This simulates items whose due_period does NOT match `D-${daysLeft}`
          mockQuery.mockResolvedValueOnce({ rows: [] });

          const sentCount = await triggerChecklistDeadlineNotifications();

          // No notifications should be created
          expect(sentCount).toBe(0);
          expect(createChecklistDueNotification).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should skip notification if one was already sent today for the same item', () => {
    return fc.assert(
      fc.asyncProperty(
        coupleArb,
        checklistItemArb,
        usersArb,
        async (couple, item, userIds) => {
          vi.clearAllMocks();

          const matchingDuePeriod = `D-${couple.daysLeft}`;
          const weddingDate = new Date();
          weddingDate.setDate(weddingDate.getDate() + couple.daysLeft);
          const weddingDateStr = weddingDate.toISOString().split('T')[0];

          (calculateDday as ReturnType<typeof vi.fn>).mockReturnValue(couple.daysLeft);

          const mockQuery = pool.query as ReturnType<typeof vi.fn>;

          // 1. Couples query
          mockQuery.mockResolvedValueOnce({
            rows: [{ couple_id: couple.couple_id, wedding_date: weddingDateStr }],
          });

          // 2. Checklist items query - returns matching item
          mockQuery.mockResolvedValueOnce({
            rows: [{
              id: item.id,
              title: item.title,
              due_period: matchingDuePeriod,
              due_date: item.due_date,
            }],
          });

          // 3. Users query
          const userRows = userIds.map((id) => ({ id }));
          mockQuery.mockResolvedValueOnce({ rows: userRows });

          // 4. For each user: existing notification check returns a result (already sent today)
          for (let i = 0; i < userIds.length; i++) {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-notif' }] });
          }

          const sentCount = await triggerChecklistDeadlineNotifications();

          // No new notifications should be created since all already exist
          expect(sentCount).toBe(0);
          expect(createChecklistDueNotification).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
