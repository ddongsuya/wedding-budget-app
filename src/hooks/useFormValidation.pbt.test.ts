/**
 * Property-Based Test: 필수 필드 유효성 검사
 * Feature: beta-readiness-review, Property 29: 필수 필드 유효성 검사
 *
 * 필수 필드 비어있을 때 에러 메시지 표시 및 제출 차단 검증
 *
 * **Validates: Requirements 12.1, 12.4**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateValue, ValidationRule } from './useFormValidation';

/**
 * Arbitrary: 비어있는 값 생성기 (null, undefined, '')
 */
const emptyValueArb = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.constant('')
);

/**
 * Arbitrary: 비어있지 않은 문자열 생성기
 * 최소 1자 이상의 문자열을 생성한다.
 */
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 100 });

/**
 * Arbitrary: 에러 메시지 생성기
 * 비어있지 않은 문자열로 에러 메시지를 생성한다.
 */
const errorMessageArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

/**
 * Arbitrary: min 값 생성기
 */
const minValueArb = fc.integer({ min: -10000, max: 10000 });

describe('Feature: beta-readiness-review, Property 29: 필수 필드 유효성 검사', () => {
  it('for any empty value, a required rule always returns the error message', () => {
    fc.assert(
      fc.property(emptyValueArb, errorMessageArb, (emptyValue, message) => {
        const rules: ValidationRule[] = [{ required: true, message }];
        const result = validateValue(emptyValue, rules);
        expect(result).toBe(message);
      }),
      { numRuns: 100 }
    );
  });

  it('for any non-empty string, a required rule always returns null', () => {
    fc.assert(
      fc.property(nonEmptyStringArb, errorMessageArb, (value, message) => {
        const rules: ValidationRule[] = [{ required: true, message }];
        const result = validateValue(value, rules);
        expect(result).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('for any number below min, the min rule returns the error message', () => {
    fc.assert(
      fc.property(minValueArb, errorMessageArb, (minVal, message) => {
        // Generate a number strictly below minVal
        const belowMin = minVal - 1 - Math.abs(fc.sample(fc.nat({ max: 1000 }), 1)[0]);
        const rules: ValidationRule[] = [{ min: minVal, message }];
        const result = validateValue(belowMin, rules);
        expect(result).toBe(message);
      }),
      { numRuns: 100 }
    );
  });

  it('for any number >= min, the min rule returns null', () => {
    fc.assert(
      fc.property(minValueArb, fc.nat({ max: 10000 }), errorMessageArb, (minVal, offset, message) => {
        const value = minVal + offset; // always >= minVal
        const rules: ValidationRule[] = [{ min: minVal, message }];
        const result = validateValue(value, rules);
        expect(result).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});
