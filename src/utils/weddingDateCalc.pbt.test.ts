/**
 * Property 17: 결혼 예정일 변경 전파
 *
 * 변경 후 D-day 계산, 시기 계산이 새 날짜 기준으로 갱신되는지 검증
 *
 * **Validates: Requirements 7.1**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateDday, periodRemainingDays, recalculateAfterDateChange } from './weddingDateCalc';
import type { DuePeriod } from '@/types/checklist';

const ALL_DUE_PERIODS: DuePeriod[] = [
  'D-180', 'D-150', 'D-120', 'D-90', 'D-60', 'D-30', 'D-14', 'D-7', 'D-1', 'D-DAY',
];

const DUE_PERIOD_DAYS: Record<string, number> = {
  'D-180': 180, 'D-150': 150, 'D-120': 120, 'D-90': 90,
  'D-60': 60, 'D-30': 30, 'D-14': 14, 'D-7': 7, 'D-1': 1, 'D-DAY': 0,
};

// 날짜 arbitrary: 오늘 기준 -365 ~ +730일 범위
const dateArb = fc.integer({ min: -365, max: 730 }).map((offset) => {
  const d = new Date(2025, 0, 1);
  d.setDate(d.getDate() + offset);
  return d;
});

const weddingDateStrArb = dateArb.map(
  (d) => d.toISOString().split('T')[0],
);

const duePeriodArb = fc.constantFrom(...ALL_DUE_PERIODS);

describe('Feature: beta-readiness-review, Property 17: 결혼 예정일 변경 전파', () => {
  it('D-day는 결혼 예정일과 오늘 사이의 일수 차이와 일치해야 한다', () => {
    fc.assert(
      fc.property(weddingDateStrArb, dateArb, (weddingDate, today) => {
        const dday = calculateDday(weddingDate, today);
        const wedding = new Date(weddingDate);
        wedding.setHours(0, 0, 0, 0);
        const todayNorm = new Date(today);
        todayNorm.setHours(0, 0, 0, 0);
        const expectedDiff = Math.ceil(
          (wedding.getTime() - todayNorm.getTime()) / (1000 * 3600 * 24),
        );
        expect(dday).toBe(expectedDiff);
      }),
      { numRuns: 200 },
    );
  });

  it('결혼 예정일 변경 시 새 날짜 기준으로 D-day가 갱신된다', () => {
    fc.assert(
      fc.property(
        weddingDateStrArb,
        weddingDateStrArb,
        dateArb,
        (oldDate, newDate, today) => {
          const oldDday = calculateDday(oldDate, today);
          const newDday = calculateDday(newDate, today);

          // 새 날짜가 이전 날짜보다 미래이면 D-day가 더 크다
          const oldWedding = new Date(oldDate);
          const newWedding = new Date(newDate);
          if (newWedding.getTime() > oldWedding.getTime()) {
            expect(newDday).toBeGreaterThan(oldDday);
          } else if (newWedding.getTime() < oldWedding.getTime()) {
            expect(newDday).toBeLessThan(oldDday);
          } else {
            expect(newDday).toBe(oldDday);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('시기 잔여일은 D-day에서 해당 시기 일수를 뺀 값이어야 한다', () => {
    fc.assert(
      fc.property(
        weddingDateStrArb,
        duePeriodArb,
        dateArb,
        (weddingDate, period, today) => {
          const dday = calculateDday(weddingDate, today);
          const remaining = periodRemainingDays(period, dday);
          const periodDays = DUE_PERIOD_DAYS[period];
          expect(remaining).toBe(dday - periodDays);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('recalculateAfterDateChange는 모든 시기에 대해 올바른 잔여일을 반환한다', () => {
    fc.assert(
      fc.property(
        weddingDateStrArb,
        fc.subarray(ALL_DUE_PERIODS, { minLength: 1 }),
        dateArb,
        (weddingDate, periods, today) => {
          const result = recalculateAfterDateChange(weddingDate, periods, today);
          const expectedDday = calculateDday(weddingDate, today);
          expect(result.dday).toBe(expectedDday);

          for (const period of periods) {
            expect(result.periodRemaining[period]).toBe(
              expectedDday - DUE_PERIOD_DAYS[period],
            );
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});
