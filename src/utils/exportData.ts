/**
 * CSV/JSON 내보내기 유틸리티
 * 데이터를 CSV 또는 JSON 파일로 변환하여 Blob 다운로드를 트리거한다.
 */

/**
 * CSV 값 이스케이프 처리
 * 쉼표, 큰따옴표, 줄바꿈이 포함된 값을 RFC 4180 규격에 맞게 이스케이프한다.
 */
export function escapeCSVValue(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * 객체 배열을 CSV 문자열로 변환한다 (다운로드 없이 순수 변환).
 * 테스트 가능한 순수 함수.
 */
export function generateCSVString(data: Record<string, any>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const headerRow = headers.map(escapeCSVValue).join(',');

  const rows = data.map(item =>
    headers.map(header => escapeCSVValue(item[header])).join(',')
  );

  return [headerRow, ...rows].join('\n');
}

/**
 * Blob을 파일로 다운로드 트리거
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 객체 배열을 CSV 형식으로 변환하여 파일 다운로드를 트리거한다.
 *
 * @param data - 내보낼 객체 배열 (첫 번째 객체의 키를 헤더로 사용)
 * @param filename - 다운로드 파일명 (기본값: 'export.csv')
 */
export function exportToCSV(data: Record<string, any>[], filename: string = 'export.csv'): void {
  if (data.length === 0) {
    triggerDownload(new Blob([''], { type: 'text/csv;charset=utf-8;' }), filename);
    return;
  }

  const csv = generateCSVString(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

/**
 * 데이터를 JSON 형식으로 변환하여 파일 다운로드를 트리거한다.
 *
 * @param data - 내보낼 데이터 (any 타입)
 * @param filename - 다운로드 파일명 (기본값: 'export.json')
 */
export function exportToJSON(data: any, filename: string = 'export.json'): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, filename);
}
