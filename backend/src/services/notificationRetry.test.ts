/**
 * Tests for Notification Retry Service
 * Requirements 9.5: 알림 발송 실패 시 재시도 로직
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

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
import {
  markNotificationFailed,
  markNotificationPermanentlyFailed,
  markNotificationSent,
  getRetryableNotifications,
  retryNotification,
  processFailedNotifications,
} from './notificationRetry';

describe('notificationRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('markNotificationFailed', () => {
    it('should increment retry_count and set delivery_status to failed', async () => {
      (pool.query as any).mockResolvedValue({ rows: [] });

      await markNotificationFailed('notif-1');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("delivery_status = 'failed'"),
        ['notif-1']
      );
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('retry_count = retry_count + 1'),
        ['notif-1']
      );
    });
  });

  describe('markNotificationPermanentlyFailed', () => {
    it('should set delivery_status to permanently_failed', async () => {
      (pool.query as any).mockResolvedValue({ rows: [] });

      await markNotificationPermanentlyFailed('notif-2');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("delivery_status = 'permanently_failed'"),
        ['notif-2']
      );
    });
  });

  describe('markNotificationSent', () => {
    it('should set delivery_status to sent', async () => {
      (pool.query as any).mockResolvedValue({ rows: [] });

      await markNotificationSent('notif-3');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("delivery_status = 'sent'"),
        ['notif-3']
      );
    });
  });

  describe('getRetryableNotifications', () => {
    it('should query for failed notifications with retry_count < 3', async () => {
      const mockNotifications = [
        { id: 'n1', user_id: 'u1', title: 'Test', message: 'msg', data: {}, link: '/', retry_count: 1 },
      ];
      (pool.query as any).mockResolvedValue({ rows: mockNotifications });

      const result = await getRetryableNotifications();

      expect(result).toEqual(mockNotifications);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("delivery_status = 'failed'"),
        [3]
      );
    });

    it('should return empty array when no retryable notifications exist', async () => {
      (pool.query as any).mockResolvedValue({ rows: [] });

      const result = await getRetryableNotifications();

      expect(result).toEqual([]);
    });
  });

  describe('retryNotification', () => {
    const baseNotification = {
      id: 'notif-1',
      user_id: 'user-1',
      title: '결제 예정 알림',
      message: '결제 예정일이 다가옵니다',
      data: { expenseId: '123' },
      link: '/expenses?id=123',
      retry_count: 1,
    };

    it('should mark as sent on successful push delivery', async () => {
      (sendPushNotification as any).mockResolvedValue({ success: 1, failed: 0 });
      (pool.query as any).mockResolvedValue({ rows: [] });

      const result = await retryNotification(baseNotification);

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("delivery_status = 'sent'"),
        ['notif-1']
      );
    });

    it('should mark as failed when push delivery fails and retry_count < 3', async () => {
      (sendPushNotification as any).mockResolvedValue({ success: 0, failed: 1 });
      (pool.query as any).mockResolvedValue({ rows: [] });

      const result = await retryNotification({ ...baseNotification, retry_count: 0 });

      expect(result).toBe(false);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("delivery_status = 'failed'"),
        ['notif-1']
      );
    });

    it('should mark as permanently_failed when retry_count reaches max (3)', async () => {
      (sendPushNotification as any).mockResolvedValue({ success: 0, failed: 1 });
      (pool.query as any).mockResolvedValue({ rows: [] });

      const result = await retryNotification({ ...baseNotification, retry_count: 2 });

      expect(result).toBe(false);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("delivery_status = 'permanently_failed'"),
        ['notif-1']
      );
    });

    it('should mark as permanently_failed on exception when retry_count reaches max', async () => {
      (sendPushNotification as any).mockRejectedValue(new Error('Push service down'));
      (pool.query as any).mockResolvedValue({ rows: [] });

      const result = await retryNotification({ ...baseNotification, retry_count: 2 });

      expect(result).toBe(false);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("delivery_status = 'permanently_failed'"),
        ['notif-1']
      );
    });

    it('should mark as failed on exception when retry_count < max', async () => {
      (sendPushNotification as any).mockRejectedValue(new Error('Push service down'));
      (pool.query as any).mockResolvedValue({ rows: [] });

      const result = await retryNotification({ ...baseNotification, retry_count: 0 });

      expect(result).toBe(false);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("delivery_status = 'failed'"),
        ['notif-1']
      );
    });
  });

  describe('processFailedNotifications', () => {
    it('should process all retryable notifications', async () => {
      const mockNotifications = [
        { id: 'n1', user_id: 'u1', title: 'T1', message: 'M1', data: {}, link: '/', retry_count: 0 },
        { id: 'n2', user_id: 'u2', title: 'T2', message: 'M2', data: {}, link: '/', retry_count: 1 },
      ];

      // First call: getRetryableNotifications query
      (pool.query as any)
        .mockResolvedValueOnce({ rows: mockNotifications })
        // Subsequent calls: markNotificationSent/markNotificationFailed
        .mockResolvedValue({ rows: [] });

      (sendPushNotification as any)
        .mockResolvedValueOnce({ success: 1, failed: 0 }) // n1 succeeds
        .mockResolvedValueOnce({ success: 0, failed: 1 }); // n2 fails

      const result = await processFailedNotifications();

      expect(result.retried).toBe(2);
      expect(result.succeeded).toBe(1);
    });

    it('should return zeros when no retryable notifications exist', async () => {
      (pool.query as any).mockResolvedValue({ rows: [] });

      const result = await processFailedNotifications();

      expect(result.retried).toBe(0);
      expect(result.succeeded).toBe(0);
      expect(result.permanentlyFailed).toBe(0);
    });

    it('should count permanently failed notifications correctly', async () => {
      const mockNotifications = [
        { id: 'n1', user_id: 'u1', title: 'T1', message: 'M1', data: {}, link: '/', retry_count: 2 },
      ];

      (pool.query as any)
        .mockResolvedValueOnce({ rows: mockNotifications })
        .mockResolvedValue({ rows: [] });

      (sendPushNotification as any).mockResolvedValue({ success: 0, failed: 1 });

      const result = await processFailedNotifications();

      expect(result.retried).toBe(1);
      expect(result.succeeded).toBe(0);
      expect(result.permanentlyFailed).toBe(1);
    });
  });
});
