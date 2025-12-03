import { pool } from '../config/database';
import { createBudgetWarningNotification } from './notificationService';

// 예산 임계값 상수
export const BUDGET_WARNING_THRESHOLD = 0.8; // 80%
export const BUDGET_EXCEEDED_THRESHOLD = 1.0; // 100%

// 예산 대비 지출 비율 계산
export const calculateBudgetPercentage = (
  totalBudget: number,
  totalExpenses: number
): number => {
  if (totalBudget <= 0) return 0;
  return (totalExpenses / totalBudget) * 100;
};

// 임계값 도달 여부 확인
export const checkBudgetThreshold = (
  percentage: number
): 'none' | 'warning' | 'exceeded' => {
  if (percentage > BUDGET_EXCEEDED_THRESHOLD * 100) {
    return 'exceeded';
  }
  if (percentage > BUDGET_WARNING_THRESHOLD * 100) {
    return 'warning';
  }
  return 'none';
};

// 임계값 교차 감지 (이전 비율과 현재 비율 비교)
export const detectThresholdCrossing = (
  previousPercentage: number,
  currentPercentage: number
): 'none' | 'warning' | 'exceeded' => {
  const warningThreshold = BUDGET_WARNING_THRESHOLD * 100;
  const exceededThreshold = BUDGET_EXCEEDED_THRESHOLD * 100;

  // 100% 임계값 교차
  if (previousPercentage <= exceededThreshold && currentPercentage > exceededThreshold) {
    return 'exceeded';
  }

  // 80% 임계값 교차
  if (previousPercentage <= warningThreshold && currentPercentage > warningThreshold) {
    return 'warning';
  }

  return 'none';
};

// 지출 추가 시 예산 알림 체크 및 전송
export const checkAndSendBudgetNotification = async (
  coupleId: string,
  newExpenseAmount: number
): Promise<boolean> => {
  // 예산 설정 조회
  const budgetResult = await pool.query(
    'SELECT total_budget FROM budget_settings WHERE couple_id = $1',
    [coupleId]
  );

  if (budgetResult.rows.length === 0 || !budgetResult.rows[0].total_budget) {
    return false;
  }

  const totalBudget = budgetResult.rows[0].total_budget;

  // 이전 총 지출 조회 (새 지출 제외)
  const previousExpensesResult = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE couple_id = $1',
    [coupleId]
  );

  const previousTotal = parseFloat(previousExpensesResult.rows[0].total) - newExpenseAmount;
  const currentTotal = parseFloat(previousExpensesResult.rows[0].total);

  const previousPercentage = calculateBudgetPercentage(totalBudget, previousTotal);
  const currentPercentage = calculateBudgetPercentage(totalBudget, currentTotal);

  // 임계값 교차 감지
  const crossing = detectThresholdCrossing(previousPercentage, currentPercentage);

  if (crossing === 'none') {
    return false;
  }

  // 커플의 모든 사용자에게 알림 전송
  const usersResult = await pool.query(
    'SELECT id FROM users WHERE couple_id = $1',
    [coupleId]
  );

  for (const user of usersResult.rows) {
    await createBudgetWarningNotification(
      user.id,
      currentPercentage,
      totalBudget,
      currentTotal
    );
  }

  return true;
};

// 모든 커플의 예산 상태 체크 (스케줄러용)
export const checkAllCouplesBudgetStatus = async (): Promise<number> => {
  let notificationCount = 0;

  // 예산이 설정된 모든 커플 조회
  const couplesResult = await pool.query(
    `SELECT bs.couple_id, bs.total_budget,
            COALESCE(SUM(e.amount), 0) as total_expenses
     FROM budget_settings bs
     LEFT JOIN expenses e ON e.couple_id = bs.couple_id
     WHERE bs.total_budget > 0
     GROUP BY bs.couple_id, bs.total_budget`
  );

  for (const couple of couplesResult.rows) {
    const percentage = calculateBudgetPercentage(
      couple.total_budget,
      parseFloat(couple.total_expenses)
    );

    const threshold = checkBudgetThreshold(percentage);

    if (threshold !== 'none') {
      // 오늘 이미 같은 타입의 알림을 보냈는지 확인
      const existingResult = await pool.query(
        `SELECT n.id FROM notifications n
         JOIN users u ON u.id = n.user_id
         WHERE u.couple_id = $1
           AND n.type IN ('budget_warning', 'budget_exceeded')
           AND n.created_at::date = CURRENT_DATE`,
        [couple.couple_id]
      );

      if (existingResult.rows.length === 0) {
        // 커플의 모든 사용자에게 알림 전송
        const usersResult = await pool.query(
          'SELECT id FROM users WHERE couple_id = $1',
          [couple.couple_id]
        );

        for (const user of usersResult.rows) {
          await createBudgetWarningNotification(
            user.id,
            percentage,
            couple.total_budget,
            parseFloat(couple.total_expenses)
          );
          notificationCount++;
        }
      }
    }
  }

  return notificationCount;
};
