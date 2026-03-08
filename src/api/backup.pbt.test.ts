/**
 * Property-Based Test: 데이터 백업/복원 라운드 트립
 * Feature: beta-readiness-review, Property 18: 데이터 백업/복원 라운드 트립
 *
 * JSON 내보내기 후 가져오기 시 원본 데이터와 동일 검증
 *
 * **Validates: Requirements 7.2, 7.3**
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

// Mock the API client to simulate export/import round-trip.
// The mock stores imported data in a closure and returns it on export.
let storedData: any = null;

vi.mock('./client', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url === '/backup/export') {
        return Promise.resolve({ data: storedData });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    }),
    post: vi.fn((url: string, data: any) => {
      if (url === '/backup/import') {
        storedData = data;
        return Promise.resolve({ data: undefined });
      }
      return Promise.reject(new Error(`Unexpected POST ${url}`));
    }),
  },
}));

import { backupAPI } from './backup';

/**
 * Arbitrary: JSON-serializable 예산 데이터 생성기
 */
const budgetArb = fc.record({
  total_budget: fc.integer({ min: 0, max: 100_000_000 }),
  categories: fc.array(
    fc.record({
      id: fc.integer({ min: 1, max: 1000 }),
      name: fc.string({ minLength: 1, maxLength: 20 }),
      amount: fc.integer({ min: 0, max: 50_000_000 }),
    }),
    { minLength: 0, maxLength: 10 }
  ),
});

/**
 * Arbitrary: JSON-serializable 지출 항목 생성기
 */
/**
 * Arbitrary: ISO 날짜 문자열 생성기
 * fc.date()가 간혹 Invalid Date를 생성할 수 있으므로 정수 기반으로 안전하게 생성한다.
 */
const isoDateArb = fc
  .integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
  .map(ts => new Date(ts).toISOString());

const expenseArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  title: fc.string({ minLength: 1, maxLength: 30 }),
  amount: fc.integer({ min: 0, max: 50_000_000 }),
  category_id: fc.integer({ min: 1, max: 100 }),
  status: fc.constantFrom('planned', 'completed'),
  date: isoDateArb,
});

/**
 * Arbitrary: JSON-serializable 체크리스트 항목 생성기
 */
const checklistItemArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  is_completed: fc.boolean(),
  category: fc.constantFrom('venue', 'dress', 'photo', 'honeymoon', 'etc'),
});

/**
 * Arbitrary: JSON-serializable 일정 항목 생성기
 */
const eventArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  title: fc.string({ minLength: 1, maxLength: 30 }),
  date: isoDateArb,
  category: fc.constantFrom('meeting', 'payment', 'visit', 'etc'),
});

/**
 * Arbitrary: 전체 백업 데이터 생성기
 * 사용자의 예산, 지출, 체크리스트, 일정 데이터를 포함한다.
 */
const backupDataArb = fc.record({
  budget: budgetArb,
  expenses: fc.array(expenseArb, { minLength: 0, maxLength: 10 }),
  checklist: fc.array(checklistItemArb, { minLength: 0, maxLength: 10 }),
  events: fc.array(eventArb, { minLength: 0, maxLength: 10 }),
});

describe('Feature: beta-readiness-review, Property 18: 데이터 백업/복원 라운드 트립', () => {
  beforeEach(() => {
    storedData = null;
    vi.clearAllMocks();
  });

  it('should round-trip: importData → exportData returns the same data', async () => {
    await fc.assert(
      fc.asyncProperty(backupDataArb, async (data) => {
        // Import (store) the data
        await backupAPI.importData(data);

        // Export (retrieve) the data
        const exported = await backupAPI.exportData();

        // The exported data should be deeply equal to the original
        expect(exported).toEqual(data);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all top-level keys through round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(backupDataArb, async (data) => {
        await backupAPI.importData(data);
        const exported = await backupAPI.exportData();

        // All expected keys must be present
        expect(Object.keys(exported).sort()).toEqual(Object.keys(data).sort());
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve array lengths through round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(backupDataArb, async (data) => {
        await backupAPI.importData(data);
        const exported = await backupAPI.exportData();

        expect(exported.expenses.length).toBe(data.expenses.length);
        expect(exported.checklist.length).toBe(data.checklist.length);
        expect(exported.events.length).toBe(data.events.length);
        expect(exported.budget.categories.length).toBe(data.budget.categories.length);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle empty backup data', async () => {
    const emptyData = {
      budget: { total_budget: 0, categories: [] },
      expenses: [],
      checklist: [],
      events: [],
    };

    await backupAPI.importData(emptyData);
    const exported = await backupAPI.exportData();

    expect(exported).toEqual(emptyData);
  });
});
