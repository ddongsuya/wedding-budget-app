/**
 * 대시보드 데이터 필터링/정렬 순수 유틸리티 함수
 *
 * React 컴포넌트와 분리된 순수 함수로, 속성 기반 테스트(PBT)에서
 * 직접 테스트할 수 있다.
 *
 * Requirements: 4.1, 4.2, 4.3
 */

import type { DuePeriod } from '@/types/checklist';

// ── 타입 정의 ──────────────────────────────────────────

export interface DashboardEvent {
  id: string;
  title: string;
  date: string; // ISO date string (YYYY-MM-DD)
  [key: string]: unknown;
}

export interface DashboardExpense {
  id: string;
  title: string;
  amount: number;
  status: 'planned' | 'completed';
  dueDate?: string | null;
  [key: string]: unknown;
}

export interface DashboardChecklistItem {
  id: string;
  title: string;
  is_completed: boolean;
  due_period: DuePeriod | null;
}

// ── DuePeriod → 숫자 변환 ──────────────────────────────

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

export function duePeriodToDays(period: DuePeriod | string): number {
  return DUE_PERIOD_DAYS[period] ?? Infinity;
}

// ── Property 6: 다가오는 일정 (최대 3개, 날짜 오름차순) ──

/**
 * 다가오는 일정을 날짜 오름차순으로 정렬하여 최대 maxCount개 반환한다.
 *
 * @param events - 전체 일정 목록
 * @param maxCount - 최대 반환 개수 (기본 3)
 */
export function getUpcomingEvents<T extends DashboardEvent>(
  events: T[],
  maxCount = 3,
): T[] {
  return [...events]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, maxCount);
}

// ── Property 7: 결제 예정 필터링 (status='planned') ──

/**
 * status가 'planned'인 지출만 필터링하여 반환한다.
 */
export function getPlannedExpenses<T extends DashboardExpense>(
  expenses: T[],
): T[] {
  return expenses.filter((e) => e.status === 'planned');
}

// ── Property 8: 마감 임박 체크리스트 ──

/**
 * 미완료이고 due_period가 현재 D-day에 가장 가까운(숫자가 작은) 항목을 반환한다.
 * daysUntilWedding과 비교하여 아직 도래하지 않았거나 정확히 일치하는 항목 중
 * 가장 가까운 것을 우선 반환한다.
 *
 * @param items - 전체 체크리스트 항목
 * @param daysUntilWedding - 결혼식까지 남은 일수
 * @param maxCount - 최대 반환 개수 (기본 3)
 */
export function getUrgentChecklist<T extends DashboardChecklistItem>(
  items: T[],
  daysUntilWedding: number,
  maxCount = 3,
): T[] {
  return items
    .filter((item) => !item.is_completed && item.due_period !== null)
    .sort((a, b) => {
      const aDays = duePeriodToDays(a.due_period!);
      const bDays = duePeriodToDays(b.due_period!);
      // D-day에 가장 가까운 (차이가 작은) 항목이 먼저
      const aDiff = Math.abs(aDays - daysUntilWedding);
      const bDiff = Math.abs(bDays - daysUntilWedding);
      return aDiff - bDiff;
    })
    .slice(0, maxCount);
}

// ── Property 21 helper: 파트너 활동 알림 생성 판단 ──

export interface PartnerActivityInput {
  actorUserId: string;
  coupleId: string;
  activityType: 'expense' | 'checklist';
  action: 'add' | 'update' | 'delete';
  itemName?: string;
}

export interface PartnerActivityNotification {
  targetUserId: string;
  actorUserId: string;
  coupleId: string;
  activityType: string;
  action: string;
  itemName?: string;
}

/**
 * 파트너 활동 알림 생성 여부를 판단하고 알림 객체를 반환한다.
 * 파트너가 존재하면 알림을 생성하고, 없으면 null을 반환한다.
 *
 * @param input - 활동 정보
 * @param partnerUserId - 파트너 사용자 ID (없으면 null)
 */
export function generatePartnerActivityNotification(
  input: PartnerActivityInput,
  partnerUserId: string | null,
): PartnerActivityNotification | null {
  if (!partnerUserId) return null;
  if (!input.coupleId) return null;

  return {
    targetUserId: partnerUserId,
    actorUserId: input.actorUserId,
    coupleId: input.coupleId,
    activityType: input.activityType,
    action: input.action,
    itemName: input.itemName,
  };
}
