import { pool } from '../config/database';
import { createCoupleActivityNotification } from './notificationService';

// 파트너 정보 조회
export const getPartnerInfo = async (
  userId: string,
  coupleId: string
): Promise<{ id: string; name: string } | null> => {
  const result = await pool.query(
    `SELECT id, name FROM users
     WHERE couple_id = $1 AND id != $2`,
    [coupleId, userId]
  );

  return result.rows[0] || null;
};

// 사용자 이름 조회
export const getUserName = async (userId: string): Promise<string> => {
  const result = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.name || '파트너';
};

// 커플 활동 알림 전송 (파트너에게)
export const notifyPartnerOfActivity = async (
  actorUserId: string,
  coupleId: string,
  activityType: 'venue' | 'expense' | 'checklist' | 'schedule',
  action: 'add' | 'update' | 'delete',
  itemName?: string
): Promise<boolean> => {
  // 파트너 정보 조회
  const partner = await getPartnerInfo(actorUserId, coupleId);

  if (!partner) {
    return false; // 파트너가 없으면 알림 전송 안함
  }

  // 행위자 이름 조회
  const actorName = await getUserName(actorUserId);

  // 알림 생성
  const notification = await createCoupleActivityNotification(
    partner.id,
    actorName,
    activityType,
    action,
    itemName
  );

  return !!notification;
};

// 식장 변경 알림
export const notifyVenueChange = async (
  userId: string,
  coupleId: string,
  action: 'add' | 'update' | 'delete',
  venueName?: string
): Promise<boolean> => {
  return notifyPartnerOfActivity(userId, coupleId, 'venue', action, venueName);
};

// 지출 변경 알림
export const notifyExpenseChange = async (
  userId: string,
  coupleId: string,
  action: 'add' | 'update' | 'delete',
  expenseDescription?: string
): Promise<boolean> => {
  return notifyPartnerOfActivity(userId, coupleId, 'expense', action, expenseDescription);
};

// 체크리스트 변경 알림
export const notifyChecklistChange = async (
  userId: string,
  coupleId: string,
  action: 'add' | 'update' | 'delete',
  itemTitle?: string
): Promise<boolean> => {
  return notifyPartnerOfActivity(userId, coupleId, 'checklist', action, itemTitle);
};

// 일정 변경 알림
export const notifyScheduleChange = async (
  userId: string,
  coupleId: string,
  action: 'add' | 'update' | 'delete',
  eventTitle?: string
): Promise<boolean> => {
  return notifyPartnerOfActivity(userId, coupleId, 'schedule', action, eventTitle);
};
