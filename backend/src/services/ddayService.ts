import { pool } from '../config/database';
import { createDdayMilestoneNotification, createNotification } from './notificationService';

// D-day 계산 함수
export const calculateDday = (weddingDate: Date | string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const wedding = new Date(weddingDate);
  wedding.setHours(0, 0, 0, 0);

  const diffTime = wedding.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

// 마일스톤 값 목록
export const MILESTONES = [100, 30, 7, 1, 0];

// 마일스톤 여부 확인
export const isMilestone = (daysLeft: number): boolean => {
  return MILESTONES.includes(daysLeft);
};

// 모든 커플의 D-day 마일스톤 체크 및 알림 생성
export const checkAndSendDdayMilestoneNotifications = async (): Promise<number> => {
  let sentCount = 0;

  // 결혼 날짜가 설정된 모든 커플 프로필 조회
  const profilesResult = await pool.query(
    `SELECT cp.couple_id, cp.wedding_date, u.id as user_id
     FROM couple_profiles cp
     JOIN users u ON u.couple_id = cp.couple_id
     WHERE cp.wedding_date IS NOT NULL
       AND cp.wedding_date >= CURRENT_DATE`
  );

  for (const row of profilesResult.rows) {
    const daysLeft = calculateDday(row.wedding_date);

    if (isMilestone(daysLeft)) {
      // 오늘 이미 같은 마일스톤 알림을 보냈는지 확인
      const existingNotification = await pool.query(
        `SELECT id FROM notifications
         WHERE user_id = $1
           AND type = 'dday_milestone'
           AND data->>'daysLeft' = $2
           AND created_at::date = CURRENT_DATE`,
        [row.user_id, daysLeft.toString()]
      );

      if (existingNotification.rows.length === 0) {
        const notification = await createDdayMilestoneNotification(
          row.user_id,
          daysLeft,
          row.wedding_date
        );

        if (notification) {
          sentCount++;
        }
      }
    }
  }

  return sentCount;
};

// 일일 D-day 알림 전송 (설정된 사용자에게만)
export const sendDailyDdayNotifications = async (): Promise<number> => {
  let sentCount = 0;

  // D-day 일일 알림이 활성화된 사용자 조회
  const usersResult = await pool.query(
    `SELECT np.user_id, cp.wedding_date
     FROM notification_preferences np
     JOIN users u ON u.id = np.user_id
     JOIN couple_profiles cp ON cp.couple_id = u.couple_id
     WHERE np.dday_daily = true
       AND cp.wedding_date IS NOT NULL
       AND cp.wedding_date >= CURRENT_DATE`
  );

  for (const row of usersResult.rows) {
    const daysLeft = calculateDday(row.wedding_date);

    // 오늘 이미 일일 알림을 보냈는지 확인
    const existingNotification = await pool.query(
      `SELECT id FROM notifications
       WHERE user_id = $1
         AND type = 'dday_daily'
         AND created_at::date = CURRENT_DATE`,
      [row.user_id]
    );

    if (existingNotification.rows.length === 0) {
      const notification = await createNotification({
        user_id: row.user_id,
        type: 'dday_daily',
        title: `D-${daysLeft === 0 ? 'Day' : daysLeft}`,
        message:
          daysLeft === 0
            ? '오늘이 결혼식 날이에요! 🎊'
            : `결혼식까지 ${daysLeft}일 남았어요 💕`,
        data: { daysLeft, weddingDate: row.wedding_date },
        link: '/',
      });

      if (notification) {
        sentCount++;
      }
    }
  }

  return sentCount;
};
