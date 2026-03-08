/**
 * 결혼 예정일 관련 순수 계산 함수
 *
 * Settings에서 결혼 예정일 변경 시 Dashboard D-day, Checklist 시기 계산 등에
 * 사용되는 순수 함수를 모아둔다. PBT 테스트 대상.
 *
 * Requirements: 7.1
 */

import type { DuePeriod } from '@/types/checklist';

/**
 * 결혼 예정일까지 남은 일수(D-day)를 계산한다.
 * 양수: 결혼식이 미래, 0: 당일, 음수: 결혼식이 과거
 */
export function calculateDday(weddingDate: string, today: Date = new Date()): number {
  const wedding = new Date(weddingDate);
  wedding.setHours(0, 0, 0, 0);
  const todayNorm = new Date(today);
  todayNorm.setHours(0, 0, 0, 0);
  const diff = wedding.getTime() - todayNorm.getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
}

const DUE_PERIOD_DAYS: Record<string, number> = {
  'D-180': 180,
  'D-150': 150,
  'D-120': 120,
  'D-90': 90,
  'D-60': 60,
  'D-30': 30,
  'D-14': 14,
  'D-7': 7,
  'D-1': 1,
  'D-DAY': 0,
  'AFTER': -1,
};

/**
 * 체크리스트 항목의 due_period가 현재 D-day 기준으로 "임박"한지 판단한다.
 * due_period의 일수가 daysUntilWedding 이상이면 아직 해당 시기가 도래하지 않은 것이고,
 * 미만이면 이미 해당 시기가 지난 것이다.
 *
 * 반환: 해당 시기까지 남은 일수 (음수면 이미 지남)
 */
export function periodRemainingDays(
  duePeriod: DuePeriod,
  daysUntilWedding: number,
): number {
  const periodDays = DUE_PERIOD_DAYS[duePeriod] ?? Infinity;
  // 예: D-30이고 결혼까지 45일 남았으면 → 45 - 30 = 15일 후에 해당 시기
  // 예: D-30이고 결혼까지 20일 남았으면 → 20 - 30 = -10 (이미 지남)
  return daysUntilWedding - periodDays;
}

/**
 * 결혼 예정일이 변경되었을 때, 새 날짜 기준으로 D-day와 시기 계산이
 * 올바르게 갱신되는지 검증하기 위한 헬퍼.
 *
 * 새 결혼 예정일에 대해 D-day를 계산하고,
 * 체크리스트 항목들의 시기 잔여일을 재계산한다.
 */
export function recalculateAfterDateChange(
  newWeddingDate: string,
  duePeriods: DuePeriod[],
  today: Date = new Date(),
): { dday: number; periodRemaining: Record<string, number> } {
  const dday = calculateDday(newWeddingDate, today);
  const periodRemaining: Record<string, number> = {};
  for (const period of duePeriods) {
    periodRemaining[period] = periodRemainingDays(period, dday);
  }
  return { dday, periodRemaining };
}
