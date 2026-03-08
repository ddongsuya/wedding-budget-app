/**
 * Property-Based Tests for API Error Message Mapping
 * Feature: beta-readiness-review, Property 30: API 에러 메시지 매핑
 * Validates: Requirements 12.2
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { AxiosError, AxiosHeaders } from 'axios';

// Import the getErrorMessage function
import { getErrorMessage } from './client';

// Known status codes and their expected Korean messages
const STATUS_MESSAGE_MAP: Record<number, string> = {
  400: '입력 정보를 확인해주세요.',
  401: '로그인이 필요합니다.',
  403: '접근 권한이 없습니다.',
  404: '요청한 정보를 찾을 수 없습니다.',
  409: '이미 존재하는 데이터입니다.',
  422: '입력 형식이 올바르지 않습니다.',
  429: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  502: '서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요.',
  503: '서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요.',
  504: '서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요.',
};

const KNOWN_STATUS_CODES = Object.keys(STATUS_MESSAGE_MAP).map(Number);

function createAxiosError(status: number, serverMessage?: string): AxiosError<any> {
  const headers = new AxiosHeaders();
  const error = new AxiosError(
    `Request failed with status code ${status}`,
    String(status),
    undefined,
    undefined,
    {
      data: serverMessage ? { message: serverMessage } : {},
      status,
      statusText: '',
      headers,
      config: { headers } as any,
    }
  );
  return error;
}

function createNetworkError(code?: string): AxiosError<any> {
  const error = new AxiosError('Network Error', code || 'ERR_NETWORK');
  // No response property for network errors
  return error;
}

describe('Feature: beta-readiness-review, Property 30: API 에러 메시지 매핑', () => {
  it('should return Korean message for every known HTTP error status code', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KNOWN_STATUS_CODES),
        (statusCode) => {
          const error = createAxiosError(statusCode);
          const message = getErrorMessage(error);

          // Message should be a non-empty Korean string
          expect(message).toBeTruthy();
          expect(typeof message).toBe('string');
          expect(message.length).toBeGreaterThan(0);

          // Message should match the expected Korean message for this status code
          expect(message).toBe(STATUS_MESSAGE_MAP[statusCode]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should prefer server-provided message over default mapping', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KNOWN_STATUS_CODES),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        (statusCode, serverMessage) => {
          const error = createAxiosError(statusCode, serverMessage);
          const message = getErrorMessage(error);

          // When server provides a message, it should be used instead of default
          expect(message).toBe(serverMessage);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return fallback message for unknown status codes', () => {
    // Generate status codes that are NOT in our known map
    const unknownStatusArb = fc.integer({ min: 100, max: 599 })
      .filter(code => !KNOWN_STATUS_CODES.includes(code));

    fc.assert(
      fc.property(
        unknownStatusArb,
        (statusCode) => {
          const error = createAxiosError(statusCode);
          const message = getErrorMessage(error);

          // Should return the default fallback message
          expect(message).toBe('오류가 발생했습니다. 다시 시도해주세요.');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return network error message when no response exists', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(undefined, 'ERR_NETWORK', 'ERR_BAD_REQUEST'),
        (errorCode) => {
          const error = createNetworkError(errorCode);
          const message = getErrorMessage(error);

          // Should return a network-related Korean message
          expect(message).toBeTruthy();
          expect(typeof message).toBe('string');
          // Network errors should mention network or timeout
          expect(
            message.includes('네트워크') || message.includes('시간이 초과')
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return timeout message for ECONNABORTED code', () => {
    const error = createNetworkError('ECONNABORTED');
    const message = getErrorMessage(error);
    expect(message).toBe('요청 시간이 초과되었습니다. 다시 시도해주세요.');
  });
});
