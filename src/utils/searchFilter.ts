/**
 * 검색 및 필터 유틸리티 (순수 함수)
 * 체크리스트/일정 검색 및 완료/미완료 필터 로직
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4
 */

export interface SearchableItem {
  id: string;
  title: string;
}

export interface ChecklistFilterItem extends SearchableItem {
  is_completed: boolean;
}

export interface ScheduleFilterItem extends SearchableItem {
  categoryLabel?: string | null;
}

/**
 * 제목 기준 검색 필터링 (대소문자 무시)
 * 검색 쿼리가 비어있으면 전체 목록 반환
 */
export function filterByTitle<T extends SearchableItem>(
  items: T[],
  query: string,
): T[] {
  const trimmed = query.trim();
  if (!trimmed) return items;
  const lower = trimmed.toLowerCase();
  return items.filter((item) => item.title.toLowerCase().includes(lower));
}

/**
 * 일정 검색 필터링 (제목 + 카테고리 라벨)
 */
export function filterScheduleItems(
  items: ScheduleFilterItem[],
  query: string,
): ScheduleFilterItem[] {
  const trimmed = query.trim();
  if (!trimmed) return items;
  const lower = trimmed.toLowerCase();
  return items.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(lower);
    const categoryMatch = item.categoryLabel
      ? item.categoryLabel.toLowerCase().includes(lower)
      : false;
    return titleMatch || categoryMatch;
  });
}

/**
 * 완료/미완료 필터
 * showCompleted=true이면 전체, false이면 미완료만
 */
export function filterByCompletion(
  items: ChecklistFilterItem[],
  showCompleted: boolean,
): ChecklistFilterItem[] {
  if (showCompleted) return items;
  return items.filter((item) => !item.is_completed);
}

/**
 * 검색어 초기화 버튼 표시 여부
 */
export function shouldShowClearButton(query: string): boolean {
  return query.length > 0;
}

/**
 * 검색어 초기화
 */
export function clearSearchQuery(): string {
  return '';
}
