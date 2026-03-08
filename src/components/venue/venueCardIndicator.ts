/**
 * 식장 카드 인디케이터 로직 (순수 함수)
 * VenueCardDeck.tsx에서 사용하는 "현재/전체" 인디케이터 계산
 *
 * Requirements 6.1: 모바일에서 식장 카드 스와이프 시 현재 카드 번호와 전체 카드 수 표시
 */

/**
 * 카드 인디케이터 텍스트 생성
 * @param currentIndex 0-based 현재 카드 인덱스
 * @param totalCount 전체 카드 수
 * @returns "i/N" 형식 문자열 (1-based)
 */
export function getCardIndicatorText(currentIndex: number, totalCount: number): string {
  const displayIndex = currentIndex + 1; // 0-based → 1-based
  return `${displayIndex} / ${totalCount}`;
}

/**
 * 카드 인디케이터 유효성 검증
 * @param currentIndex 0-based 현재 카드 인덱스
 * @param totalCount 전체 카드 수
 * @returns 1 ≤ displayIndex ≤ totalCount 인지 여부
 */
export function isValidCardIndicator(currentIndex: number, totalCount: number): boolean {
  if (totalCount <= 0) return false;
  const displayIndex = currentIndex + 1;
  return displayIndex >= 1 && displayIndex <= totalCount;
}
