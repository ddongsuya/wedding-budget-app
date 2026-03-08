import { pool } from '../config/database';
import { sendPushNotification, PushPayload } from './pushService';

const MAX_RETRY_COUNT = 3;

/**
 * 알림 발송 실패 시 retry_count 증가, delivery_status 'failed' 설정, last_retry_at 기록
 *
 * Requirements: 9.5
 */
export const markNotificationFailed = async (notificationId: string): Promise<void> => {
  await pool.query(
    `UPDATE notifications
     SET delivery_status = 'failed',
         retry_count = retry_count + 1,
         last_retry_at = NOW()
     WHERE id = $1`,
    [notificationId]
  );
};

/**
 * 최대 재시도 횟수 초과 시 delivery_status를 'permanently_failed'로 설정
 */
export const markNotificationPermanentlyFailed = async (notificationId: string): Promise<void> => {
  await pool.query(
    `UPDATE notifications
     SET delivery_status = 'permanently_failed',
         last_retry_at = NOW()
     WHERE id = $1`,
    [notificationId]
  );
};

/**
 * 알림 발송 성공 시 delivery_status를 'sent'로 설정
 */
export const markNotificationSent = async (notificationId: string): Promise<void> => {
  await pool.query(
    `UPDATE notifications
     SET delivery_status = 'sent',
         last_retry_at = NOW()
     WHERE id = $1`,
    [notificationId]
  );
};

/**
 * 실패한 알림 중 재시도 가능한 알림 조회
 * delivery_status='failed' AND retry_count < MAX_RETRY_COUNT
 */
export const getRetryableNotifications = async (): Promise<any[]> => {
  const result = await pool.query(
    `SELECT n.id, n.user_id, n.title, n.message, n.data, n.link, n.retry_count
     FROM notifications n
     WHERE n.delivery_status = 'failed'
       AND n.retry_count < $1
     ORDER BY n.created_at ASC`,
    [MAX_RETRY_COUNT]
  );
  return result.rows;
};

/**
 * 단일 알림 재시도 발송
 * 성공 시 delivery_status='sent', 실패 시 retry_count 증가
 * 최대 재시도 횟수 초과 시 'permanently_failed'
 */
export const retryNotification = async (notification: {
  id: string;
  user_id: string;
  title: string;
  message: string;
  data: Record<string, any>;
  link?: string;
  retry_count: number;
}): Promise<boolean> => {
  try {
    const pushPayload: PushPayload = {
      title: notification.title,
      body: notification.message,
      data: { url: notification.link || '/' },
    };

    const result = await sendPushNotification(notification.user_id, pushPayload);

    if (result.success > 0) {
      await markNotificationSent(notification.id);
      return true;
    }

    // 푸시 구독이 없거나 모두 실패한 경우
    const newRetryCount = notification.retry_count + 1;
    if (newRetryCount >= MAX_RETRY_COUNT) {
      await markNotificationPermanentlyFailed(notification.id);
    } else {
      await markNotificationFailed(notification.id);
    }
    return false;
  } catch (error) {
    console.error(`[NotificationRetry] Failed to retry notification ${notification.id}:`, error);

    const newRetryCount = notification.retry_count + 1;
    if (newRetryCount >= MAX_RETRY_COUNT) {
      await markNotificationPermanentlyFailed(notification.id);
    } else {
      await markNotificationFailed(notification.id);
    }
    return false;
  }
};

/**
 * 모든 실패한 알림을 재시도한다.
 * 스케줄러에서 주기적으로 호출한다.
 *
 * Requirements: 9.5
 */
export const processFailedNotifications = async (): Promise<{
  retried: number;
  succeeded: number;
  permanentlyFailed: number;
}> => {
  const notifications = await getRetryableNotifications();
  let succeeded = 0;
  let permanentlyFailed = 0;

  for (const notification of notifications) {
    const success = await retryNotification(notification);
    if (success) {
      succeeded++;
    } else if (notification.retry_count + 1 >= MAX_RETRY_COUNT) {
      permanentlyFailed++;
    }
  }

  console.log(
    `[NotificationRetry] Processed ${notifications.length} failed notifications: ` +
      `succeeded=${succeeded}, permanentlyFailed=${permanentlyFailed}`
  );

  return {
    retried: notifications.length,
    succeeded,
    permanentlyFailed,
  };
};
