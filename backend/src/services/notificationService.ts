import { pool } from '../config/database';
import { CreateNotificationInput, NotificationType } from '../types';
import { sendPushNotification, PushPayload } from './pushService';

// 알림 생성
export const createNotification = async (input: CreateNotificationInput): Promise<any> => {
  const { user_id, type, title, message, data = {}, link } = input;

  // 사용자의 알림 설정 확인
  const prefResult = await pool.query(
    'SELECT * FROM notification_preferences WHERE user_id = $1',
    [user_id]
  );

  const preferences = prefResult.rows[0];

  // 알림 설정에 따라 필터링
  if (preferences) {
    const typeToPreference: Record<NotificationType, string> = {
      dday_milestone: 'dday_enabled',
      dday_daily: 'dday_daily',
      schedule_reminder: 'schedule_enabled',
      checklist_due: 'checklist_enabled',
      checklist_overdue: 'checklist_enabled',
      budget_warning: 'budget_enabled',
      budget_exceeded: 'budget_enabled',
      couple_activity: 'couple_enabled',
      announcement: 'announcement_enabled',
    };

    const prefKey = typeToPreference[type];
    if (prefKey && preferences[prefKey] === false) {
      return null; // 알림 설정이 꺼져있으면 생성하지 않음
    }
  }

  const result = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, data, link)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [user_id, type, title, message, JSON.stringify(data), link]
  );

  const notification = result.rows[0];

  // 푸시 알림 전송 (푸시 설정이 켜져있는 경우)
  if (preferences?.push_enabled !== false) {
    try {
      const pushPayload: PushPayload = {
        title,
        body: message,
        data: { url: link || '/' },
      };
      await sendPushNotification(user_id, pushPayload);
    } catch (error) {
      console.error('Push notification error:', error);
    }
  }

  return notification;
};

// 여러 사용자에게 알림 생성 (공지사항 등)
export const createBulkNotifications = async (
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  data: Record<string, any> = {},
  link?: string
): Promise<number> => {
  let createdCount = 0;

  for (const userId of userIds) {
    const notification = await createNotification({
      user_id: userId,
      type,
      title,
      message,
      data,
      link,
    });

    if (notification) {
      createdCount++;
    }
  }

  return createdCount;
};


// 모든 활성 사용자에게 공지사항 알림 전송
export const sendAnnouncementToAllUsers = async (
  announcementId: number,
  title: string,
  content: string,
  isImportant: boolean = false
): Promise<number> => {
  // 모든 활성 사용자 조회
  const usersResult = await pool.query(
    'SELECT id FROM users WHERE is_admin = false'
  );

  const userIds = usersResult.rows.map((row) => row.id);

  return createBulkNotifications(
    userIds,
    'announcement',
    title,
    content.substring(0, 200) + (content.length > 200 ? '...' : ''),
    { announcementId, isImportant },
    '/announcements'
  );
};

// D-day 마일스톤 알림 생성
export const createDdayMilestoneNotification = async (
  userId: string,
  daysLeft: number,
  weddingDate: string
): Promise<any> => {
  const milestoneMessages: Record<number, string> = {
    100: '결혼식까지 100일 남았어요! 💕',
    30: '결혼식까지 한 달 남았어요! 준비 잘 되고 있나요?',
    7: '결혼식까지 일주일! 마지막 점검을 해보세요.',
    1: '내일이 결혼식이에요! 오늘 푹 쉬세요. 💐',
    0: '오늘이 결혼식 날이에요! 축하합니다! 🎊',
  };

  const message = milestoneMessages[daysLeft];
  if (!message) return null;

  return createNotification({
    user_id: userId,
    type: 'dday_milestone',
    title: `D-${daysLeft === 0 ? 'Day' : daysLeft}`,
    message,
    data: { daysLeft, weddingDate },
    link: '/',
  });
};

// 예산 경고 알림 생성
export const createBudgetWarningNotification = async (
  userId: string,
  percentage: number,
  totalBudget: number,
  totalExpenses: number
): Promise<any> => {
  const isExceeded = percentage > 100;

  return createNotification({
    user_id: userId,
    type: isExceeded ? 'budget_exceeded' : 'budget_warning',
    title: isExceeded ? '예산 초과! 💸' : '예산 경고 ⚠️',
    message: isExceeded
      ? `예산을 ${(percentage - 100).toFixed(1)}% 초과했어요. 지출을 점검해보세요.`
      : `예산의 ${percentage.toFixed(1)}%를 사용했어요. 남은 예산을 확인해보세요.`,
    data: { percentage, totalBudget, totalExpenses },
    link: '/budget',
  });
};

// 커플 활동 알림 생성
export const createCoupleActivityNotification = async (
  partnerId: string,
  actorName: string,
  activityType: 'venue' | 'expense' | 'checklist' | 'schedule',
  action: 'add' | 'update' | 'delete',
  itemName?: string
): Promise<any> => {
  const activityMessages: Record<string, Record<string, string>> = {
    venue: {
      add: `${actorName}님이 새 식장을 추가했어요`,
      update: `${actorName}님이 식장 정보를 수정했어요`,
      delete: `${actorName}님이 식장을 삭제했어요`,
    },
    expense: {
      add: `${actorName}님이 새 지출을 추가했어요`,
      update: `${actorName}님이 지출 정보를 수정했어요`,
      delete: `${actorName}님이 지출을 삭제했어요`,
    },
    checklist: {
      add: `${actorName}님이 체크리스트 항목을 추가했어요`,
      update: `${actorName}님이 체크리스트를 완료했어요`,
      delete: `${actorName}님이 체크리스트 항목을 삭제했어요`,
    },
    schedule: {
      add: `${actorName}님이 새 일정을 추가했어요`,
      update: `${actorName}님이 일정을 수정했어요`,
      delete: `${actorName}님이 일정을 삭제했어요`,
    },
  };

  const linkMap: Record<string, string> = {
    venue: '/venues',
    expense: '/budget',
    checklist: '/checklist',
    schedule: '/schedule',
  };

  return createNotification({
    user_id: partnerId,
    type: 'couple_activity',
    title: '파트너 활동',
    message: activityMessages[activityType][action] + (itemName ? `: ${itemName}` : ''),
    data: { actorName, activityType, action, itemName },
    link: linkMap[activityType],
  });
};

// 체크리스트 마감 알림 생성
export const createChecklistDueNotification = async (
  userId: string,
  itemTitle: string,
  dueDate: string,
  isOverdue: boolean = false
): Promise<any> => {
  return createNotification({
    user_id: userId,
    type: isOverdue ? 'checklist_overdue' : 'checklist_due',
    title: isOverdue ? '마감일 초과! ⏰' : '마감일 임박 📋',
    message: isOverdue
      ? `"${itemTitle}" 항목의 마감일이 지났어요.`
      : `"${itemTitle}" 항목의 마감일이 내일이에요.`,
    data: { itemTitle, dueDate, isOverdue },
    link: '/checklist',
  });
};
