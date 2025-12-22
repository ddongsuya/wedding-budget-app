/**
 * Property-Based Tests for API Error Response Consistency
 * 
 * **Feature: project-optimization, Property 1: API Error Response Consistency**
 * **Validates: Requirements 1.4, 10.4**
 * 
 * Property: For any API endpoint that encounters an error, the response should be 
 * a valid JSON object with `success: false` and a `message` field, never an 
 * unhandled exception or HTML error page.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { Response } from 'express';
import {
  sendError,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendRateLimited,
  sendInternalError,
  handleDatabaseError,
  ErrorCodes,
  ErrorResponseData,
} from './errorResponse';

// Mock Express Response
const createMockResponse = (): Response => {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as Response;
};

describe('API Error Response Consistency - Property Based Tests', () => {
  /**
   * **Feature: project-optimization, Property 1: API Error Response Consistency**
   * **Validates: Requirements 1.4, 10.4**
   * 
   * Property: For any error message and status code, sendError should always
   * return a response with success: false and a message field.
   */
  describe('Property 1: sendError always returns consistent format', () => {
    it('should always include success: false and message for any input', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 599 }), // HTTP error status codes
          fc.string({ minLength: 1, maxLength: 500 }), // Error message
          fc.option(fc.string({ minLength: 1, maxLength: 50 })), // Optional error code
          (status, message, code) => {
            const res = createMockResponse();
            
            sendError(res, status, message, code ?? undefined);
            
            // Verify status was called with correct code
            expect(res.status).toHaveBeenCalledWith(status);
            
            // Verify json was called
            expect(res.json).toHaveBeenCalled();
            
            // Get the response body
            const responseBody = (res.json as any).mock.calls[0][0] as ErrorResponseData;
            
            // Property: success must always be false
            expect(responseBody.success).toBe(false);
            
            // Property: message must always be present and be a string
            expect(typeof responseBody.message).toBe('string');
            expect(responseBody.message.length).toBeGreaterThan(0);
            
            // Property: if code was provided, it should be in response
            if (code) {
              expect(responseBody.code).toBe(code);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: project-optimization, Property 1: API Error Response Consistency**
   * **Validates: Requirements 1.4, 10.4**
   * 
   * Property: All convenience error methods should produce consistent format
   */
  describe('Property 1: Convenience methods produce consistent format', () => {
    const errorMethods = [
      { name: 'sendBadRequest', fn: sendBadRequest, expectedStatus: 400 },
      { name: 'sendUnauthorized', fn: sendUnauthorized, expectedStatus: 401 },
      { name: 'sendForbidden', fn: sendForbidden, expectedStatus: 403 },
      { name: 'sendNotFound', fn: sendNotFound, expectedStatus: 404 },
      { name: 'sendConflict', fn: sendConflict, expectedStatus: 409 },
      { name: 'sendRateLimited', fn: sendRateLimited, expectedStatus: 429 },
      { name: 'sendInternalError', fn: sendInternalError, expectedStatus: 500 },
    ];

    errorMethods.forEach(({ name, fn, expectedStatus }) => {
      it(`${name} should always return consistent error format`, () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 200 }), // Custom message
            (customMessage) => {
              const res = createMockResponse();
              
              fn(res, customMessage);
              
              // Verify correct status code
              expect(res.status).toHaveBeenCalledWith(expectedStatus);
              
              // Get response body
              const responseBody = (res.json as any).mock.calls[0][0] as ErrorResponseData;
              
              // Property: success must be false
              expect(responseBody.success).toBe(false);
              
              // Property: message must be present
              expect(typeof responseBody.message).toBe('string');
              expect(responseBody.message.length).toBeGreaterThan(0);
              
              // Property: code must be present
              expect(typeof responseBody.code).toBe('string');
              
              return true;
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });

  /**
   * **Feature: project-optimization, Property 1: API Error Response Consistency**
   * **Validates: Requirements 1.4, 10.4**
   * 
   * Property: handleDatabaseError should always return consistent format
   * for any PostgreSQL error code
   */
  describe('Property 1: Database error handling produces consistent format', () => {
    it('should handle any PostgreSQL error code consistently', () => {
      // Common PostgreSQL error codes
      const pgErrorCodes = [
        '23505', // unique_violation
        '23503', // foreign_key_violation
        '23502', // not_null_violation
        '22P02', // invalid_text_representation
        'ECONNREFUSED',
        'ENOTFOUND',
        '42P01', // undefined_table
        '42703', // undefined_column
        'UNKNOWN', // Unknown error
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...pgErrorCodes),
          fc.string({ minLength: 1, maxLength: 200 }),
          (errorCode, errorMessage) => {
            const res = createMockResponse();
            const mockError = {
              code: errorCode,
              message: errorMessage,
            };
            
            handleDatabaseError(res, mockError);
            
            // Verify json was called
            expect(res.json).toHaveBeenCalled();
            
            // Get response body
            const responseBody = (res.json as any).mock.calls[0][0] as ErrorResponseData;
            
            // Property: success must be false
            expect(responseBody.success).toBe(false);
            
            // Property: message must be present and non-empty
            expect(typeof responseBody.message).toBe('string');
            expect(responseBody.message.length).toBeGreaterThan(0);
            
            // Property: code must be present
            expect(typeof responseBody.code).toBe('string');
            
            // Property: response should never contain raw error details
            expect(responseBody.message).not.toContain('stack');
            expect(responseBody.message).not.toContain('Error:');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should map specific PostgreSQL errors to appropriate HTTP status codes', () => {
      const errorMappings = [
        { code: '23505', expectedStatus: 409 }, // unique_violation -> Conflict
        { code: '23503', expectedStatus: 400 }, // foreign_key_violation -> Bad Request
        { code: '23502', expectedStatus: 400 }, // not_null_violation -> Bad Request
        { code: '22P02', expectedStatus: 400 }, // invalid_text_representation -> Bad Request
        { code: 'ECONNREFUSED', expectedStatus: 500 }, // Connection error -> Internal
        { code: 'UNKNOWN', expectedStatus: 500 }, // Unknown -> Internal
      ];

      errorMappings.forEach(({ code, expectedStatus }) => {
        const res = createMockResponse();
        handleDatabaseError(res, { code, message: 'Test error' });
        
        expect(res.status).toHaveBeenCalledWith(expectedStatus);
      });
    });
  });

  /**
   * **Feature: project-optimization, Property 1: API Error Response Consistency**
   * **Validates: Requirements 1.4, 10.4**
   * 
   * Property: Error responses should never contain sensitive information
   */
  describe('Property 1: Error responses do not leak sensitive information', () => {
    it('should not include stack traces or internal paths in error messages', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          (message) => {
            const res = createMockResponse();
            
            // Simulate an error with stack trace
            const errorWithStack = {
              code: 'INTERNAL',
              message: message,
              stack: 'Error: Something went wrong\n    at Object.<anonymous> (/app/src/controllers/test.ts:42:15)',
            };
            
            handleDatabaseError(res, errorWithStack);
            
            const responseBody = (res.json as any).mock.calls[0][0] as ErrorResponseData;
            
            // Property: response should not contain file paths
            expect(JSON.stringify(responseBody)).not.toMatch(/\/app\/|\/src\/|\.ts:|\.js:/);
            
            // Property: response should not contain 'at Object' or similar stack trace patterns
            expect(JSON.stringify(responseBody)).not.toMatch(/at\s+\w+\./);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: project-optimization, Property 1: API Error Response Consistency**
   * **Validates: Requirements 1.4, 10.4**
   * 
   * Property: All ErrorCodes should be valid string constants
   */
  describe('Property 1: ErrorCodes are valid constants', () => {
    it('all error codes should be non-empty strings', () => {
      Object.entries(ErrorCodes).forEach(([key, value]) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
        // Error codes should be uppercase with underscores
        expect(value).toMatch(/^[A-Z][A-Z0-9_]*$/);
      });
    });
  });

  /**
   * **Feature: project-optimization, Property 1: API Error Response Consistency**
   * **Validates: Requirements 1.4, 10.4**
   * 
   * Property: Error responses with validation errors should include errors array
   */
  describe('Property 1: Validation errors include field-level details', () => {
    it('should include errors array when validation errors are provided', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              field: fc.string({ minLength: 1, maxLength: 50 }),
              message: fc.string({ minLength: 1, maxLength: 200 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (validationErrors) => {
            const res = createMockResponse();
            
            sendBadRequest(
              res,
              '입력값이 올바르지 않습니다',
              ErrorCodes.VALIDATION_ERROR,
              validationErrors
            );
            
            const responseBody = (res.json as any).mock.calls[0][0] as ErrorResponseData;
            
            // Property: errors array should be present
            expect(Array.isArray(responseBody.errors)).toBe(true);
            expect(responseBody.errors?.length).toBe(validationErrors.length);
            
            // Property: each error should have field and message
            responseBody.errors?.forEach((error, index) => {
              expect(error.field).toBe(validationErrors[index].field);
              expect(error.message).toBe(validationErrors[index].message);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
