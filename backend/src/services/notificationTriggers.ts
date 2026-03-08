import { pool } from '../config/database';
import { createNotification, createChecklistDueNotification } from './notificationService';
import { notifyPartnerOfActivity } from './coupleNotificationService';
import { calculateDday } from './ddayService';
import { processFailedNotifications } from './notificationRetry';

/**
 * 체크리스트 마감 시기 도래 알림 트리거
 * 
 * due_period(예: 'D-30')가 현재 D-day와 일치하는 미완료 항목에 대해
 * 해당 사용자에게 완료 독촉 알림을 발송한다.
 * 
 * Requirements: 9.1
 */
export const triggerChecklistDeadlineNotifications = async (): Promise<number> => {
  let sentCount = 0;

  // 결혼 날짜가 설정된 모든 커플 조회
  const couplesResult = await pool.query(
    `SELECT cp.couple_id, cp.wedding_date
     FROM couple_profiles cp
     WHERE cp.wedding_date IS NOT NULL
       AND cp.wedding_date >= CURRENT_DATE`
  );

  for (const couple of couplesResult.rows) {
    const daysLeft = calculateDday(couple.wedding_date);
    const currentDdayPeriod = `D-${daysLeft}`;

    // 해당 커플의 미완료 체크리스트 중 due_period가 현재 D-day와 일치하는 항목 조회
    const itemsResult = await pool.query(
      `SELECT ci.id, ci.title, ci.due_period, ci.due_date
       FROM checklist_items ci
       WHERE ci.couple_id = $1
         AND ci.is_completed = FALSE
         AND ci.due_period = $2`,
      [couple.couple_id, currentDdayPeriod]
    );

    if (itemsResult.rows.length === 0) continue;

    // 해당 커플의 모든 사용자 조회
    const usersResult = await pool.query(
      'SELECT id FROM users WHERE couple_id = $1',
      [couple.couple_id]
    );

    for (const item of itemsResult.rows) {
      for (const user of usersResult.rows) {
        // 오늘 이미 같은 항목에 대한 알림을 보냈는지 확인
        const existingResult = await pool.query(
          `SELECT id FROM notifications
           WHERE user_id = $1
             AND type IN ('checklist_due', 'checklist_overdue')
             AND data->>'itemTitle' = $2
             AND created_at::date = CURRENT_DATE`,
          [user.id, item.title]
        );

        if (existingResult.rows.length === 0) {
          const notification = await createChecklistDueNotification(
            user.id,
            item.title,
            item.due_date || couple.wedding_date,
            false
          );

          if (notification) {
            sentCount++;
          }
        }
      }
    }
  }

  return sentCount;
};

/**
 * 결제 예정 지출 알림 트리거
 * 
 * status='planned'이고 due_date가 현재 날짜로부터 3일 이내인 지출에 대해
 * 해당 커플의 사용자에게 결제 예정 알림을 발송한다.
 * 
 * Requirements: 9.2, 5.3
 */
export const triggerPaymentDueNotifications = async (): Promise<number> => {
  let sentCount = 0;

  // status='planned'이고 due_date가 3일 이내인 지출 조회
  const expensesResult = await pool.query(
    `SELECT e.id, e.title, e.amount, e.due_date, e.couple_id
     FROM expenses e
     WHERE e.status = 'planned'
       AND e.due_date IS NOT NULL
       AND e.due_date >= CURRENT_DATE
       AND e.due_date <= CURRENT_DATE + INTERVAL '3 days'`
  );

  for (const expense of expensesResult.rows) {
    // 해당 커플의 모든 사용자 조회
    const usersResult = await pool.query(
      'SELECT id FROM users WHERE couple_id = $1',
      [expense.couple_id]
    );

    const daysUntilDue = Math.ceil(
      (new Date(expense.due_date).getTime() - new Date().setHours(0, 0, 0, 0)) /
        (1000 * 60 * 60 * 24)
    );

    for (const user of usersResult.rows) {
      // 오늘 이미 같은 지출에 대한 알림을 보냈는지 확인
      const existingResult = await pool.query(
        `SELECT id FROM notifications
         WHERE user_id = $1
           AND type = 'budget_warning'
           AND data->>'expenseId' = $2
           AND created_at::date = CURRENT_DATE`,
        [user.id, expense.id.toString()]
      );

      if (existingResult.rows.length === 0) {
        const dueMessage =
          daysUntilDue === 0
            ? `"${expense.title}" 결제 예정일이 오늘이에요!`
            : `"${expense.title}" 결제 예정일이 ${daysUntilDue}일 남았어요.`;

        const notification = await createNotification({
          user_id: user.id,
          type: 'budget_warning',
          title: '결제 예정 알림 💳',
          message: dueMessage,
          data: {
            expenseId: expense.id.toString(),
            expenseTitle: expense.title,
            amount: expense.amount,
            dueDate: expense.due_date,
            daysUntilDue,
          },
          link: `/expenses?id=${expense.id}`,
        });

        if (notification) {
          sentCount++;
        }
      }
    }
  }

  return sentCount;
};

/**
 * 커플 파트너 활동 알림 트리거
 * 
 * 파트너가 지출을 등록하거나 체크리스트를 완료하면
 * 상대방에게 활동 알림을 발송한다.
 * 
 * 이 함수는 컨트롤러에서 직접 호출하는 방식으로 사용한다.
 * (이벤트 기반 트리거)
 * 
 * Requirements: 9.3
 */
export const triggerPartnerActivityNotification = async (
  actorUserId: string,
  coupleId: string,
  activityType: 'expense' | 'checklist',
  action: 'add' | 'update' | 'delete',
  itemName?: string,
  itemId?: string
): Promise<boolean> => {
  return notifyPartnerOfActivity(
    actorUserId,
    coupleId,
    activityType,
    action,
    itemName,
    itemId
  );
};

/**
 * 모든 주기적 알림 트리거를 실행한다.
 * 서버 시작 시 또는 스케줄러에서 호출한다.
 * 
 * - 체크리스트 마감 시기 도래 알림
 * - 결제 예정 지출 알림
 * - 실패한 알림 재시도 (최대 3회)
 */
export const runScheduledNotificationTriggers = async (): Promise<{
  checklistNotifications: number;
  paymentNotifications: number;
  retryResults: { retried: number; succeeded: number; permanentlyFailed: number };
}> => {
  const checklistNotifications = await triggerChecklistDeadlineNotifications();
  const paymentNotifications = await triggerPaymentDueNotifications();
  const retryResults = await processFailedNotifications();

  console.log(
    `[NotificationTriggers] Scheduled triggers completed: ` +
      `checklist=${checklistNotifications}, payment=${paymentNotifications}, ` +
      `retried=${retryResults.retried}, retrySucceeded=${retryResults.succeeded}`
  );

  return { checklistNotifications, paymentNotifications, retryResults };
};
