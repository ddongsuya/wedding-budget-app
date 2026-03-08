/**
 * 알림 딥링크 네비게이션 로직을 결정하는 순수 함수
 * 알림 클릭 시 네비게이션 여부, 대상 경로, 읽음 처리 여부를 반환한다.
 */

export interface NotificationForNav {
  id: string;
  is_read: boolean;
  link?: string | null;
}

export interface DeeplinkResult {
  shouldNavigate: boolean;
  targetPath: string | null;
  shouldMarkAsRead: boolean;
}

export function resolveNotificationDeeplink(notification: NotificationForNav): DeeplinkResult {
  return {
    shouldNavigate: !!notification.link,
    targetPath: notification.link || null,
    shouldMarkAsRead: !notification.is_read,
  };
}
