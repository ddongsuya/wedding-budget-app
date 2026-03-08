/**
 * Property-Based Test: 폼 임시 저장 라운드 트립
 * Feature: beta-readiness-review, Property 16: 폼 임시 저장 라운드 트립
 *
 * localStorage 저장 후 복원 시 원본 데이터와 동일 검증
 *
 * **Validates: Requirements 6.5, 12.5**
 */
import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { saveDraft, readDraft, removeDraft, getStorageKey, DRAFT_PREFIX } from './useFormDraft';

beforeEach(() => {
  localStorage.clear();
});

/**
 * Arbitrary: JSON-serializable 값 생성기.
 * 문자열, 숫자, 불리언, null, 배열, 객체를 재귀적으로 생성한다.
 */
const jsonSerializableArb = fc.jsonValue();

/**
 * Arbitrary: localStorage 키 생성기.
 * 빈 문자열이 아닌 영문/숫자/언더스코어 조합.
 */
const storageKeyArb = fc
  .stringMatching(/^[a-zA-Z][a-zA-Z0-9_]{0,19}$/)
  .filter(s => s.length > 0);

describe('Feature: beta-readiness-review, Property 16: 폼 임시 저장 라운드 트립', () => {
  it('should round-trip: saveDraft(key, data) → readDraft(key) produces identical data', () => {
    fc.assert(
      fc.property(storageKeyArb, jsonSerializableArb, (key, data) => {
        saveDraft(key, data);
        const restored = readDraft(key);

        // JSON 직렬화/역직렬화를 거치므로 JSON 라운드트립 기준으로 비교
        // (JSON.stringify는 -0을 0으로 변환하므로 원본도 동일하게 정규화)
        const expected = JSON.parse(JSON.stringify(data));
        expect(restored).toEqual(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('should return null after removeDraft(key)', () => {
    fc.assert(
      fc.property(storageKeyArb, jsonSerializableArb, (key, data) => {
        saveDraft(key, data);
        removeDraft(key);
        const restored = readDraft(key);

        expect(restored).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('should return null for keys that were never saved', () => {
    fc.assert(
      fc.property(storageKeyArb, (key) => {
        const restored = readDraft(key);
        expect(restored).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('should use DRAFT_PREFIX in storage key', () => {
    fc.assert(
      fc.property(storageKeyArb, (key) => {
        const storageKey = getStorageKey(key);
        expect(storageKey).toBe(`${DRAFT_PREFIX}${key}`);
        expect(storageKey.startsWith('form_draft_')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should overwrite previous draft when saving with same key', () => {
    fc.assert(
      fc.property(storageKeyArb, jsonSerializableArb, jsonSerializableArb, (key, data1, data2) => {
        saveDraft(key, data1);
        saveDraft(key, data2);
        const restored = readDraft(key);

        const expected = JSON.parse(JSON.stringify(data2));
        expect(restored).toEqual(expected);
      }),
      { numRuns: 100 }
    );
  });
});
