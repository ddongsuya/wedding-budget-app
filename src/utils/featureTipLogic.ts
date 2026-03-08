/**
 * 기능 페이지 사용 팁 표시 로직
 * 각 주요 페이지 첫 방문 시 localStorage 기반으로 팁을 표시한다.
 */

const FEATURE_TIP_PREFIX = 'featureTip_visited_';

/**
 * 해당 페이지의 팁을 표시해야 하는지 결정하는 순수 함수
 * @param pageKey 페이지 식별 키
 * @param visitedPages 이미 방문한 페이지 키 목록
 * @returns 팁을 표시해야 하면 true
 */
export function shouldShowFeatureTip(pageKey: string, visitedPages: string[]): boolean {
  return !visitedPages.includes(pageKey);
}

/**
 * localStorage에서 방문한 페이지 목록을 가져온다
 */
export function getVisitedPages(): string[] {
  try {
    const stored = localStorage.getItem(FEATURE_TIP_PREFIX + 'list');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * 페이지를 방문 완료로 표시한다
 */
export function markPageVisited(pageKey: string): void {
  const visited = getVisitedPages();
  if (!visited.includes(pageKey)) {
    visited.push(pageKey);
    localStorage.setItem(FEATURE_TIP_PREFIX + 'list', JSON.stringify(visited));
  }
}

/**
 * 페이지별 사용 팁 정의
 */
export const PAGE_TIPS: Record<string, { title: string; description: string }> = {
  dashboard: {
    title: '대시보드',
    description: '결혼 준비 전체 현황을 한눈에 확인하세요. KPI 카드를 클릭하면 상세 페이지로 이동합니다.',
  },
  budget: {
    title: '예산 관리',
    description: '카테고리별 예산을 설정하고 지출을 추적하세요. 카테고리를 클릭하면 해당 지출 내역을 볼 수 있습니다.',
  },
  expenses: {
    title: '지출 관리',
    description: '지출을 등록하고 카테고리별로 관리하세요. CSV로 내보내기도 가능합니다.',
  },
  checklist: {
    title: '체크리스트',
    description: 'D-day 기반으로 할일을 관리하세요. 완료 시 관련 지출이나 일정을 바로 등록할 수 있습니다.',
  },
  venues: {
    title: '예식장 관리',
    description: '예식장을 비교하고 계약 정보를 관리하세요. 카드를 스와이프하여 식장을 둘러보세요.',
  },
  schedule: {
    title: '일정 관리',
    description: '결혼 준비 일정을 캘린더에서 관리하세요. 날짜를 클릭하면 일정을 추가할 수 있습니다.',
  },
  photos: {
    title: '포토 레퍼런스',
    description: '스냅 촬영 참고 사진을 모아두세요. 드래그로 순서를 변경할 수 있습니다.',
  },
};
