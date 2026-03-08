/**
 * Property-Based Test: 지출 CSV 내보내기 라운드 트립
 * Feature: beta-readiness-review, Property 12: 지출 CSV 내보내기 라운드 트립
 *
 * CSV 내보내기 후 파싱하면 원본 데이터와 동일한 데이터 복원 검증
 *
 * **Validates: Requirements 5.4**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateCSVString, escapeCSVValue } from './exportData';

/**
 * RFC 4180 준수 CSV 파서.
 * 쉼표 구분, 큰따옴표 이스케이프, 줄바꿈 처리를 지원한다.
 */
function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < csv.length) {
    const ch = csv[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < csv.length && csv[i + 1] === '"') {
          // Escaped quote
          currentField += '"';
          i += 2;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
        }
      } else {
        currentField += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
      } else if (ch === '\n') {
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
        i++;
      } else if (ch === '\r') {
        // Skip \r (handle \r\n)
        i++;
      } else {
        currentField += ch;
        i++;
      }
    }
  }

  // Push last field and row.
  // The last row may not end with \n, so we always push remaining content.
  currentRow.push(currentField);
  // Only skip if the CSV was completely empty (no content at all)
  if (csv.length > 0) {
    rows.push(currentRow);
  }

  return rows;
}

/**
 * CSV 파싱 결과를 객체 배열로 변환한다.
 * 첫 번째 행을 헤더로 사용한다.
 */
function csvToObjects(csv: string): Record<string, string>[] {
  const rows = parseCSV(csv);
  if (rows.length < 2) return [];

  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] ?? '';
    });
    return obj;
  });
}

/**
 * Arbitrary: CSV-safe 키 이름 생성기.
 * 키에는 쉼표, 따옴표, 줄바꿈을 허용하지 않아 헤더 파싱을 단순화한다.
 * 영문 소문자 + 숫자 + 언더스코어로 구성된 안전한 키를 생성한다.
 */
const safeKeyArb = fc
  .string({ minLength: 1, maxLength: 15, unit: 'grapheme' })
  .map(s => s.replace(/[^a-zA-Z0-9_]/g, 'x'))
  .map(s => 'k' + s) // 항상 영문자로 시작
  .map(s => s.slice(0, 15));

/**
 * Arbitrary: CSV 셀 값 생성기.
 * 문자열과 숫자를 포함하며, 쉼표/따옴표/줄바꿈 등 특수문자도 포함할 수 있다.
 * \r은 제외 (CSV 파서에서 \r\n 처리 시 \r이 제거됨).
 */
const cellValueArb = fc.oneof(
  // 일반 문자열 (\r 제외)
  fc.string({ minLength: 0, maxLength: 50 }).filter(s => !s.includes('\r')),
  // 숫자 (문자열로 변환됨)
  fc.integer({ min: -999999, max: 999999 }).map(String),
  // 쉼표 포함 문자열
  fc.constant('hello, world'),
  // 따옴표 포함 문자열
  fc.constant('say "hi"'),
  // 줄바꿈 포함 문자열
  fc.constant('line1\nline2'),
);

/**
 * Arbitrary: 고정 키 집합을 가진 레코드 배열 생성기.
 * 모든 레코드가 동일한 키를 가지도록 보장한다.
 */
const dataArrayArb = fc
  .tuple(
    // 1~5개의 고유 키 생성
    fc.uniqueArray(safeKeyArb, { minLength: 1, maxLength: 5 }),
    // 행 수
    fc.integer({ min: 1, max: 10 })
  )
  .chain(([keys, rowCount]) =>
    fc
      .array(
        fc.tuple(...keys.map(() => cellValueArb)).map(values => {
          const obj: Record<string, string> = {};
          keys.forEach((key, idx) => {
            obj[key] = values[idx];
          });
          return obj;
        }),
        { minLength: rowCount, maxLength: rowCount }
      )
  );

describe('Feature: beta-readiness-review, Property 12: 지출 CSV 내보내기 라운드 트립', () => {
  it('should round-trip: generateCSVString → parseCSV produces equivalent data', () => {
    fc.assert(
      fc.property(dataArrayArb, (data) => {
        const csv = generateCSVString(data);
        const parsed = csvToObjects(csv);

        // 행 수 일치
        expect(parsed.length).toBe(data.length);

        // 각 행의 각 필드 값 일치 (모든 값은 String으로 변환됨)
        const headers = Object.keys(data[0]);
        for (let i = 0; i < data.length; i++) {
          for (const header of headers) {
            const original = data[i][header] === null || data[i][header] === undefined
              ? ''
              : String(data[i][header]);
            expect(parsed[i][header]).toBe(original);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve headers through round-trip', () => {
    fc.assert(
      fc.property(dataArrayArb, (data) => {
        const csv = generateCSVString(data);
        const rows = parseCSV(csv);

        // 헤더 행이 원본 키와 일치
        const originalHeaders = Object.keys(data[0]);
        expect(rows[0]).toEqual(originalHeaders);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle empty array by returning empty string', () => {
    const csv = generateCSVString([]);
    expect(csv).toBe('');
  });

  it('should correctly escape and unescape special characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }).filter(s => !s.includes('\r')),
        (value) => {
          const escaped = escapeCSVValue(value);
          // Parse the single escaped value
          const parsed = parseCSV(escaped);
          const result = parsed.length > 0 && parsed[0].length > 0 ? parsed[0][0] : '';
          expect(result).toBe(value);
        }
      ),
      { numRuns: 100 }
    );
  });
});
