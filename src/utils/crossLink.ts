import type { NavigateFunction } from 'react-router-dom';

/**
 * 모듈 간 네비게이션 파라미터
 * 예산 → 지출, 대시보드 → 일정 등 모듈 간 이동 시 필터/컨텍스트 전달
 */
export interface CrossLinkParams {
  /** 대상 라우트 (예: '/expenses', '/schedule') */
  target: string;
  /** 필터 파라미터 (URL search params로 변환) */
  filter?: Record<string, string>;
  /** 하이라이트할 항목 ID */
  highlight?: string;
  /** 수행할 액션 */
  action?: string;
}

/**
 * 모듈 간 네비게이션 수행
 * CrossLinkParams를 기반으로 URL을 구성하고 navigate 호출
 *
 * @example
 * navigateCrossLink(navigate, { target: '/expenses', filter: { category_id: '123' } })
 * // → navigates to /expenses?category_id=123
 *
 * @example
 * navigateCrossLink(navigate, { target: '/schedule', highlight: 'evt-1', action: 'view' })
 * // → navigates to /schedule?highlight=evt-1&action=view
 */
export function navigateCrossLink(
  navigate: NavigateFunction,
  params: CrossLinkParams
): void {
  const searchParams = new URLSearchParams();

  if (params.filter) {
    for (const [key, value] of Object.entries(params.filter)) {
      if (value !== undefined && value !== '') {
        searchParams.set(key, value);
      }
    }
  }

  if (params.highlight) {
    searchParams.set('highlight', params.highlight);
  }

  if (params.action) {
    searchParams.set('action', params.action);
  }

  const search = searchParams.toString();
  const path = search ? `${params.target}?${search}` : params.target;

  navigate(path);
}

/**
 * CrossLinkParams에서 URL 문자열 생성 (navigate 없이 링크만 필요할 때)
 */
export function buildCrossLinkUrl(params: CrossLinkParams): string {
  const searchParams = new URLSearchParams();

  if (params.filter) {
    for (const [key, value] of Object.entries(params.filter)) {
      if (value !== undefined && value !== '') {
        searchParams.set(key, value);
      }
    }
  }

  if (params.highlight) {
    searchParams.set('highlight', params.highlight);
  }

  if (params.action) {
    searchParams.set('action', params.action);
  }

  const search = searchParams.toString();
  return search ? `${params.target}?${search}` : params.target;
}
