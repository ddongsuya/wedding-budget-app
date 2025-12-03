import webpush from 'web-push';
import { pool } from '../config/database';

// VAPID 키 설정 (환경변수에서 가져오거나 기본값 사용)
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@weddingplanner.com';

// VAPID 키가 설정되어 있으면 web-push 설정
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    [key: string]: any;
  };
}

// 푸시 구독 저장
export const savePushSubscription = async (
  userId: string,
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  userAgent?: string
): Promise<void> => {
  try {
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, endpoint) 
       DO UPDATE SET p256dh = $3, auth = $4, user_agent = $5`,
      [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, userAgent]
    );
  } catch (error) {
    console.error('Save push subscription error:', error);
    throw error;
  }
};


// 푸시 구독 삭제
export const removePushSubscription = async (
  userId: string,
  endpoint: string
): Promise<void> => {
  try {
    await pool.query(
      'DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2',
      [userId, endpoint]
    );
  } catch (error) {
    console.error('Remove push subscription error:', error);
    throw error;
  }
};

// 사용자의 모든 푸시 구독 가져오기
export const getUserPushSubscriptions = async (userId: string) => {
  try {
    const result = await pool.query(
      'SELECT * FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Get push subscriptions error:', error);
    return [];
  }
};

// 단일 사용자에게 푸시 알림 전송
export const sendPushNotification = async (
  userId: string,
  payload: PushPayload
): Promise<{ success: number; failed: number }> => {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log('VAPID keys not configured, skipping push notification');
    return { success: 0, failed: 0 };
  }

  const subscriptions = await getUserPushSubscriptions(userId);
  let success = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/icons/icon-192x192.png',
          badge: payload.badge || '/icons/icon-96x96.png',
          tag: payload.tag,
          data: payload.data,
        })
      );
      success++;
    } catch (error: any) {
      console.error('Push notification error:', error);
      failed++;

      // 구독이 만료되었거나 유효하지 않으면 삭제
      if (error.statusCode === 404 || error.statusCode === 410) {
        await removePushSubscription(userId, sub.endpoint);
      }
    }
  }

  return { success, failed };
};

// 여러 사용자에게 푸시 알림 전송
export const sendBulkPushNotifications = async (
  userIds: string[],
  payload: PushPayload
): Promise<{ success: number; failed: number }> => {
  let totalSuccess = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, payload);
    totalSuccess += result.success;
    totalFailed += result.failed;
  }

  return { success: totalSuccess, failed: totalFailed };
};

// VAPID 공개 키 가져오기 (클라이언트에서 사용)
export const getVapidPublicKey = (): string => {
  return vapidPublicKey;
};
