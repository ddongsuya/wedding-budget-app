/**
 * 식장 비교 최저가/최고가 하이라이트 로직 (순수 함수)
 * VenueCompare.tsx에서 사용하는 항목별 최저가/최고가 계산
 *
 * Requirements 6.2: 식장 비교 시 항목별 최저가/최고가를 하이라이트 표시
 */

export type HighlightType = 'min' | 'max' | null;

/**
 * 주어진 값 배열에서 특정 인덱스의 값이 최솟값인지, 최댓값인지 판별
 * @param values 비교 대상 값 배열
 * @param index 확인할 인덱스
 * @returns 'min' | 'max' | null
 */
export function getHighlightType(values: number[], index: number): HighlightType {
  if (values.length < 2) return null;

  const value = values[index];
  const min = Math.min(...values);
  const max = Math.max(...values);

  // 모든 값이 동일하면 하이라이트 없음
  if (min === max) return null;

  if (value === min) return 'min';
  if (value === max) return 'max';
  return null;
}

/**
 * 식장 배열에서 특정 필드의 하이라이트 맵 생성
 * @param values 각 식장의 해당 필드 값 배열
 * @returns 각 인덱스별 하이라이트 타입 배열
 */
export function getHighlightMap(values: number[]): HighlightType[] {
  return values.map((_, idx) => getHighlightType(values, idx));
}
