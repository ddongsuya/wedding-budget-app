/**
 * Property-Based Tests: 커플 데이터 동기화
 * Feature: beta-readiness-review, Property 32: 커플 데이터 동기화
 *
 * 파트너 데이터 변경 시 폴링 주기 내 반영 검증
 *
 * **Validates: Requirements 13.1**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  processPollResponse,
  createInitialSyncState,
  type SyncState,
  type PollResponse,
} from './coupleSyncLogic';

// ── Arbitraries ──────────────────────────────────────────

const isoTimestampArb = fc
  .integer({ min: 1704067200000, max: 1830297600000 }) // 2024-01-01 to 2028-01-01
  .map((ms) => new Date(ms).toISOString());

const partnerNameArb = fc.option(
  fc.string({ minLength: 1, maxLength: 20 }),
  { nil: null },
);

const pollResponseArb: fc.Arbitrary<PollResponse> = fc.record({
  lastActivityAt: fc.option(isoTimestampArb, { nil: null }),
  partnerName: partnerNameArb,
});

const pollResponseWithActivityArb: fc.Arbitrary<PollResponse> = fc.record({
  lastActivityAt: isoTimestampArb,
  partnerName: fc.string({ minLength: 1, maxLength: 20 }),
});

// ── Property 32: 커플 데이터 동기화 ──────────────────────

describe('Feature: beta-readiness-review, Property 32: 커플 데이터 동기화', () => {
  /**
   * **Validates: Requirements 13.1**
   */
  it('should not invalidate on first poll (initial state)', () => {
    fc.assert(
      fc.property(pollResponseArb, (response) => {
        const initialState = createInitialSyncState();
        const result = processPollResponse(initialState, response);

        // 첫 호출에서는 무효화하지 않음
        expect(result.shouldInvalidate).toBe(false);
        // 타임스탬프가 저장됨
        expect(result.newState.lastKnownTimestamp).toBe(response.lastActivityAt);
      }),
      { numRuns: 100 },
    );
  });

  it('should invalidate when partner activity timestamp changes', () => {
    fc.assert(
      fc.property(
        isoTimestampArb,
        isoTimestampArb,
        fc.string({ minLength: 1, maxLength: 20 }),
        (oldTimestamp, newTimestamp, name) => {
          // 두 타임스탬프가 다를 때만 테스트
          fc.pre(oldTimestamp !== newTimestamp);

          const state: SyncState = {
            lastKnownTimestamp: oldTimestamp,
            isConnected: true,
            partnerName: name,
            partnerLastActivity: oldTimestamp,
          };

          const response: PollResponse = {
            lastActivityAt: newTimestamp,
            partnerName: name,
          };

          const result = processPollResponse(state, response);

          // 타임스탬프가 변경되었으므로 무효화해야 함
          expect(result.shouldInvalidate).toBe(true);
          // 새 타임스탬프가 저장됨
          expect(result.newState.lastKnownTimestamp).toBe(newTimestamp);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should not invalidate when timestamp is unchanged', () => {
    fc.assert(
      fc.property(
        isoTimestampArb,
        fc.string({ minLength: 1, maxLength: 20 }),
        (timestamp, name) => {
          const state: SyncState = {
            lastKnownTimestamp: timestamp,
            isConnected: true,
            partnerName: name,
            partnerLastActivity: timestamp,
          };

          const response: PollResponse = {
            lastActivityAt: timestamp,
            partnerName: name,
          };

          const result = processPollResponse(state, response);

          // 타임스탬프가 동일하므로 무효화하지 않음
          expect(result.shouldInvalidate).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should correctly track connection status based on partnerName', () => {
    fc.assert(
      fc.property(pollResponseArb, (response) => {
        const initialState = createInitialSyncState();
        const result = processPollResponse(initialState, response);

        // partnerName이 있으면 연결됨, 없으면 미연결
        if (response.partnerName) {
          expect(result.newState.isConnected).toBe(true);
          expect(result.newState.partnerName).toBe(response.partnerName);
        } else {
          expect(result.newState.isConnected).toBe(false);
          expect(result.newState.partnerName).toBeNull();
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should reflect partner data changes within polling cycle (sequential polls)', () => {
    fc.assert(
      fc.property(
        fc.array(pollResponseWithActivityArb, { minLength: 2, maxLength: 10 }),
        (pollResponses) => {
          let state = createInitialSyncState();
          let invalidationCount = 0;

          for (const response of pollResponses) {
            const result = processPollResponse(state, response);
            if (result.shouldInvalidate) {
              invalidationCount++;
            }
            state = result.newState;
          }

          // 마지막 상태는 마지막 응답의 타임스탬프를 반영해야 함
          const lastResponse = pollResponses[pollResponses.length - 1];
          expect(state.lastKnownTimestamp).toBe(lastResponse.lastActivityAt);
          expect(state.partnerLastActivity).toBe(lastResponse.lastActivityAt);

          // 고유한 타임스탬프 수 - 1이 최대 무효화 횟수 (첫 번째는 초기화)
          const uniqueTimestamps = new Set(pollResponses.map((r) => r.lastActivityAt));
          // 무효화 횟수는 고유 타임스탬프 수 - 1 이하
          expect(invalidationCount).toBeLessThanOrEqual(uniqueTimestamps.size);
        },
      ),
      { numRuns: 100 },
    );
  });
});
