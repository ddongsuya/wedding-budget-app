import { describe, it, expect } from 'vitest';
import { validateValue, ValidationRule } from './useFormValidation';

describe('validateValue – pure validation function', () => {
  // --- required ---
  it('returns error when required field is empty string', () => {
    const rules: ValidationRule[] = [{ required: true, message: '필수 항목입니다' }];
    expect(validateValue('', rules)).toBe('필수 항목입니다');
  });

  it('returns error when required field is null', () => {
    const rules: ValidationRule[] = [{ required: true, message: '필수' }];
    expect(validateValue(null, rules)).toBe('필수');
  });

  it('returns error when required field is undefined', () => {
    const rules: ValidationRule[] = [{ required: true, message: '필수' }];
    expect(validateValue(undefined, rules)).toBe('필수');
  });

  it('passes when required field has a value', () => {
    const rules: ValidationRule[] = [{ required: true, message: '필수' }];
    expect(validateValue('hello', rules)).toBeNull();
  });

  // --- minLength ---
  it('returns error when string is shorter than minLength', () => {
    const rules: ValidationRule[] = [{ minLength: 3, message: '최소 3자' }];
    expect(validateValue('ab', rules)).toBe('최소 3자');
  });

  it('passes when string meets minLength', () => {
    const rules: ValidationRule[] = [{ minLength: 3, message: '최소 3자' }];
    expect(validateValue('abc', rules)).toBeNull();
  });

  it('skips minLength check for empty string (use required for that)', () => {
    const rules: ValidationRule[] = [{ minLength: 3, message: '최소 3자' }];
    expect(validateValue('', rules)).toBeNull();
  });

  // --- min ---
  it('returns error when number is below min', () => {
    const rules: ValidationRule[] = [{ min: 0, message: '음수 불가' }];
    expect(validateValue(-1, rules)).toBe('음수 불가');
  });

  it('passes when number meets min', () => {
    const rules: ValidationRule[] = [{ min: 0, message: '음수 불가' }];
    expect(validateValue(0, rules)).toBeNull();
  });

  it('validates numeric strings for min', () => {
    const rules: ValidationRule[] = [{ min: 10, message: '최소 10' }];
    expect(validateValue('5', rules)).toBe('최소 10');
    expect(validateValue('15', rules)).toBeNull();
  });

  // --- pattern ---
  it('returns error when pattern does not match', () => {
    const rules: ValidationRule[] = [{ pattern: /^\d+$/, message: '숫자만 입력' }];
    expect(validateValue('abc', rules)).toBe('숫자만 입력');
  });

  it('passes when pattern matches', () => {
    const rules: ValidationRule[] = [{ pattern: /^\d+$/, message: '숫자만 입력' }];
    expect(validateValue('123', rules)).toBeNull();
  });

  it('skips pattern check for empty string', () => {
    const rules: ValidationRule[] = [{ pattern: /^\d+$/, message: '숫자만 입력' }];
    expect(validateValue('', rules)).toBeNull();
  });

  // --- multiple rules ---
  it('returns first failing rule message', () => {
    const rules: ValidationRule[] = [
      { required: true, message: '필수 항목입니다' },
      { minLength: 3, message: '최소 3자' },
    ];
    expect(validateValue('', rules)).toBe('필수 항목입니다');
  });

  it('checks subsequent rules when first passes', () => {
    const rules: ValidationRule[] = [
      { required: true, message: '필수' },
      { minLength: 5, message: '최소 5자' },
    ];
    expect(validateValue('ab', rules)).toBe('최소 5자');
  });

  it('returns null when all rules pass', () => {
    const rules: ValidationRule[] = [
      { required: true, message: '필수' },
      { minLength: 2, message: '최소 2자' },
      { min: 0, message: '음수 불가' },
    ];
    expect(validateValue('hello', rules)).toBeNull();
  });

  // --- no rules ---
  it('returns null for empty rules array', () => {
    expect(validateValue('anything', [])).toBeNull();
  });
});
