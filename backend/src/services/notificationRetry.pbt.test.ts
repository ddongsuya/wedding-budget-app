/**
 * Property-Based Test: 알림 실패 재시도
 * Feature: beta-readiness-review, Property 23: 알림 실패 재시도
 *
 * 실패 알림의 retry_count 증가, 최대 3회 초과 시 중단 검증
 *
 * **Validates: Requirements 9.5**
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

vi.mock('../config/database', () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock('./pushService', () => ({
  sendPushNotification: vi.fn(),
}));

import { pool } from '../config/database';
import { sendPushNotification } from './pushService';
import { retryNotification } from './notificationRetry';

const MAX_RETRY_COUNT = 3;

/**
 * Arbitrary: notification with retry_count in [0, 5] range
 */
const notificationArb = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  message: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
  data: fc.constant({}),
  link: fc.option(fc.webPath(), { nil: undefined }),
  retry_count: fc.integer({ min: 0, max: 5 }),
});

describe('Feature: beta-readiness-review, Property 23: 알림 실패 재시도', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should increment retry_count on failure and mark as failed when retry_count < MAX_RETRY_COUNT', () => {
    const belowMaxNotificationArb = fc.record({
      id: fc.uuid(),
      user_id: fc.uuid(),
      title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
      message: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
      data: fc.constant({}),
      link: fc.option(fc.webPath(), { nil: undefined }),
      retry_count: fc.integer({ min: 0, max: MAX_RETRY_COUNT - 2 }), // 0 or 1 → newRetryCount will be 1 or 2, both < 3
    });

    return fc.assert(
      fc.asyncProperty(belowMaxNotificationArb, async (notification) => {
        vi.clearAllMocks();

        // Simulate push failure
        (sendPushNotification as ReturnType<typeof vi.fn>).mockResolvedValue({
          success: 0,
          failed: 1,
        });
        (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });

        const result = await retryNotification(notification);

        expect(result).toBe(false);

        // Should have called markNotificationFailed (not permanently_failed)
        const queryCalls = (pool.query as ReturnType<typeof vi.fn>).mock.calls;
        const updateCall = queryCalls.find(
          (call: any[]) => typeof call[0] === 'string' && call[0].includes('delivery_status')
        );
        expect(updateCall).toBeDefined();
        expect(updateCall![0]).toContain("delivery_status = 'failed'");
        expect(updateCall![0]).toContain('retry_count = retry_count + 1');
        expect(updateCall![1]).toEqual([notification.id]);
      }),
      { numRuns: 100 }
    );
  });

  it('should mark as permanently_failed when retry_count + 1 >= MAX_RETRY_COUNT', () => {
    const atOrAboveMaxNotificationArb = fc.record({
      id: fc.uuid(),
      user_id: fc.uuid(),
      title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
      message: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
      data: fc.constant({}),
      link: fc.option(fc.webPath(), { nil: undefined }),
      retry_count: fc.integer({ min: MAX_RETRY_COUNT - 1, max: 5 }), // 2-5 → newRetryCount >= 3
    });

    return fc.assert(
      fc.asyncProperty(atOrAboveMaxNotificationArb, async (notification) => {
        vi.clearAllMocks();

        // Simulate push failure
        (sendPushNotification as ReturnType<typeof vi.fn>).mockResolvedValue({
          success: 0,
          failed: 1,
        });
        (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });

        const result = await retryNotification(notification);

        expect(result).toBe(false);

        // Should have called markNotificationPermanentlyFailed
        const queryCalls = (pool.query as ReturnType<typeof vi.fn>).mock.calls;
        const updateCall = queryCalls.find(
          (call: any[]) => typeof call[0] === 'string' && call[0].includes('delivery_status')
        );
        expect(updateCall).toBeDefined();
        expect(updateCall![0]).toContain("delivery_status = 'permanently_failed'");
        expect(updateCall![1]).toEqual([notification.id]);
      }),
      { numRuns: 100 }
    );
  });

  it('should mark as sent on successful push delivery regardless of retry_count', () => {
    return fc.assert(
      fc.asyncProperty(notificationArb, async (notification) => {
        vi.clearAllMocks();

        // Simulate push success
        (sendPushNotification as ReturnType<typeof vi.fn>).mockResolvedValue({
          success: 1,
          failed: 0,
        });
        (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });

        const result = await retryNotification(notification);

        expect(result).toBe(true);

        // Should have called markNotificationSent
        const queryCalls = (pool.query as ReturnType<typeof vi.fn>).mock.calls;
        const updateCall = queryCalls.find(
          (call: any[]) => typeof call[0] === 'string' && call[0].includes('delivery_status')
        );
        expect(updateCall).toBeDefined();
        expect(updateCall![0]).toContain("delivery_status = 'sent'");
        expect(updateCall![1]).toEqual([notification.id]);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle exceptions the same as push failure (permanently_failed when at max)', () => {
    const atMaxNotificationArb = fc.record({
      id: fc.uuid(),
      user_id: fc.uuid(),
      title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
      message: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
      data: fc.constant({}),
      link: fc.option(fc.webPath(), { nil: undefined }),
      retry_count: fc.integer({ min: MAX_RETRY_COUNT - 1, max: 5 }),
    });

    return fc.assert(
      fc.asyncProperty(atMaxNotificationArb, async (notification) => {
        vi.clearAllMocks();

        // Simulate exception
        (sendPushNotification as ReturnType<typeof vi.fn>).mockRejectedValue(
          new Error('Push service unavailable')
        );
        (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });

        const result = await retryNotification(notification);

        expect(result).toBe(false);

        const queryCalls = (pool.query as ReturnType<typeof vi.fn>).mock.calls;
        const updateCall = queryCalls.find(
          (call: any[]) => typeof call[0] === 'string' && call[0].includes('delivery_status')
        );
        expect(updateCall).toBeDefined();
        expect(updateCall![0]).toContain("delivery_status = 'permanently_failed'");
      }),
      { numRuns: 100 }
    );
  });
});
