/**
 * 체크리스트 항목별 연관 데이터 집계 유틸리티
 * 
 * Requirements: 3.2
 */

export interface RelatedEvent {
  id: string;
  checklist_item_id: string | null;
}

export interface RelatedExpense {
  id: string;
  checklist_item_id: string | null;
  amount: number;
}

export interface ChecklistRelatedSummary {
  eventCount: number;
  expenseTotal: number;
}

/**
 * 체크리스트 항목에 연관된 일정 개수와 지출 금액 합계를 계산
 * 
 * @param checklistItemId - 체크리스트 항목 ID
 * @param events - 전체 이벤트 목록 (checklist_item_id 포함)
 * @param expenses - 전체 지출 목록 (checklist_item_id, amount 포함)
 * @returns 연관 일정 개수와 지출 금액 합계
 */
export function computeChecklistRelatedSummary(
  checklistItemId: string,
  events: RelatedEvent[],
  expenses: RelatedExpense[]
): ChecklistRelatedSummary {
  const eventCount = events.filter(
    (e) => e.checklist_item_id === checklistItemId
  ).length;

  const expenseTotal = expenses
    .filter((e) => e.checklist_item_id === checklistItemId)
    .reduce((sum, e) => sum + e.amount, 0);

  return { eventCount, expenseTotal };
}

/**
 * 여러 체크리스트 항목에 대한 연관 데이터 요약을 한번에 계산
 */
export function computeAllChecklistRelatedSummaries(
  checklistItemIds: string[],
  events: RelatedEvent[],
  expenses: RelatedExpense[]
): Record<string, ChecklistRelatedSummary> {
  const result: Record<string, ChecklistRelatedSummary> = {};

  for (const itemId of checklistItemIds) {
    result[itemId] = computeChecklistRelatedSummary(itemId, events, expenses);
  }

  return result;
}
