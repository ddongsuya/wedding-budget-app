/**
 * Property-Based Tests: 알림 딥링크 정확성
 * Feature: beta-readiness-review
 *
 * Property 22: 알림 딥링크 정확성 - link 필드가 있는 알림 클릭 시 해당 경로로 네비게이션 검증
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  resolveNotificationDeeplink,
  type NotificationForNav,
} from './notificationDeeplinkLogic';

// ── Arbitraries ──────────────────────────────────────────

const linkPathArb = fc.oneof(
  fc.constant('/expenses?id=123'),
  fc.constant('/checklist'),
  fc.constant('/schedule'),
  fc.constant('/venues'),
  fc.constant('/budget'),
  fc.constant('/expenses?category_id=5'),
  fc.constant('/notifications'),
  fc.constant('/photo-references'),
  fc.webUrl().map((url) => {
    try {
      return new URL(url).pathname;
    } catch {
      return '/fallback';
    }
  }),
);

const notificationWithLinkArb: fc.Arbitrary<NotificationForNav> = fc.record({
  id: fc.uuid(),
  is_read: fc.boolean(),
  link: linkPathArb,
});

const notificationWithoutLinkArb: fc.Arbitrary<NotificationForNav> = fc.record({
  id: fc.uuid(),
  is_read: fc.boolean(),
  link: fc.constantFrom(null, undefined),
});

const anyNotificationArb: fc.Arbitrary<NotificationForNav> = fc.oneof(
  notificationWithLinkArb,
  notificationWithoutLinkArb,
);

// ── Property 22: 알림 딥링크 정확성 ──────────────────────

describe('Feature: beta-readiness-review, Property 22: 알림 딥링크 정확성', () => {
  /**
   * **Validates: Requirements 9.4**
   */
  it('should navigate to the link path when notification has a link', () => {
    fc.assert(
      fc.property(notificationWithLinkArb, (notification) => {
        const result = resolveNotificationDeeplink(notification);

        expect(result.shouldNavigate).toBe(true);
        expect(result.targetPath).toBe(notification.link);
      }),
      { numRuns: 100 },
    );
  });

  it('should NOT navigate when notification has no link', () => {
    fc.assert(
      fc.property(notificationWithoutLinkArb, (notification) => {
        const result = resolveNotificationDeeplink(notification);

        expect(result.shouldNavigate).toBe(false);
        expect(result.targetPath).toBeNull();
      }),
      { numRuns: 100 },
    );
  });

  it('should mark as read when notification is unread', () => {
    fc.assert(
      fc.property(anyNotificationArb, (notification) => {
        const result = resolveNotificationDeeplink(notification);

        if (!notification.is_read) {
          expect(result.shouldMarkAsRead).toBe(true);
        } else {
          expect(result.shouldMarkAsRead).toBe(false);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should return consistent targetPath matching the notification link', () => {
    fc.assert(
      fc.property(anyNotificationArb, (notification) => {
        const result = resolveNotificationDeeplink(notification);

        if (notification.link) {
          expect(result.targetPath).toBe(notification.link);
          expect(result.shouldNavigate).toBe(true);
        } else {
          expect(result.targetPath).toBeNull();
          expect(result.shouldNavigate).toBe(false);
        }
      }),
      { numRuns: 100 },
    );
  });
});
