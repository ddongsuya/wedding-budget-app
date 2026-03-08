/**
 * 방문일 기준 정렬 로직 (순수 함수)
 * Venues.tsx에서 사용하는 방문일 기준 정렬 로직 추출
 *
 * Requirements 6.4: 식장 목록에서 방문일 기준 정렬 옵션 제공
 */

export interface VenueForSort {
  id: string;
  name: string;
  visitDate: string | null;
}

/**
 * 방문일 기준 오름차순 정렬
 * 방문일이 없는 항목은 뒤로 보냄
 */
export function sortVenuesByVisitDateAsc(venues: VenueForSort[]): VenueForSort[] {
  return [...venues].sort((a, b) => {
    const dateA = a.visitDate || '9999-12-31';
    const dateB = b.visitDate || '9999-12-31';
    return dateA > dateB ? 1 : dateA < dateB ? -1 : 0;
  });
}

/**
 * 방문일 기준 내림차순 정렬
 * 방문일이 없는 항목은 뒤로 보냄
 */
export function sortVenuesByVisitDateDesc(venues: VenueForSort[]): VenueForSort[] {
  return [...venues].sort((a, b) => {
    const dateA = a.visitDate || '0000-01-01';
    const dateB = b.visitDate || '0000-01-01';
    return dateA < dateB ? 1 : dateA > dateB ? -1 : 0;
  });
}
