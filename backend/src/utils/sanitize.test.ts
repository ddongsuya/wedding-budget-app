/**
 * Tests for API Response Sanitization Utilities
 * Requirements 9.3: API 응답에서 민감한 필드 제외
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  sanitizeUser,
  sanitizeUsers,
  sanitizeUserForAdmin,
  sanitizeUsersForAdmin,
  excludeFields,
  selectFields,
  toPublicUser,
  PUBLIC_USER_FIELDS,
} from './sanitize';

describe('API Response Sanitization - Requirements 9.3', () => {
  describe('sanitizeUser', () => {
    it('should remove sensitive fields from user object', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password_123',
        reset_token: 'abc123',
        reset_token_expires: new Date(),
        failed_login_attempts: 3,
        locked_until: new Date(),
        created_at: new Date(),
      };

      const sanitized = sanitizeUser(user);

      expect(sanitized).not.toHaveProperty('password');
      expect(sanitized).not.toHaveProperty('reset_token');
      expect(sanitized).not.toHaveProperty('reset_token_expires');
      expect(sanitized).not.toHaveProperty('failed_login_attempts');
      expect(sanitized).not.toHaveProperty('locked_until');
      expect(sanitized).toHaveProperty('id', 1);
      expect(sanitized).toHaveProperty('email', 'test@example.com');
      expect(sanitized).toHaveProperty('name', 'Test User');
    });

    it('should return null for null or undefined input', () => {
      expect(sanitizeUser(null)).toBeNull();
      expect(sanitizeUser(undefined)).toBeNull();
    });
  });

  describe('sanitizeUsers', () => {
    it('should sanitize an array of users', () => {
      const users = [
        { id: 1, email: 'user1@test.com', password: 'pass1' },
        { id: 2, email: 'user2@test.com', password: 'pass2' },
      ];

      const sanitized = sanitizeUsers(users);

      expect(sanitized).toHaveLength(2);
      sanitized.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('sanitizeUserForAdmin', () => {
    it('should remove admin-excluded fields but keep some security info', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        reset_token: 'token',
        failed_login_attempts: 5,
        is_admin: true,
      };

      const sanitized = sanitizeUserForAdmin(user);

      expect(sanitized).not.toHaveProperty('password');
      expect(sanitized).not.toHaveProperty('reset_token');
      expect(sanitized).toHaveProperty('id');
      expect(sanitized).toHaveProperty('email');
      expect(sanitized).toHaveProperty('is_admin');
    });
  });

  describe('excludeFields', () => {
    it('should exclude specified fields from object', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const result = excludeFields(obj, ['b', 'd']);

      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should return null for null input', () => {
      expect(excludeFields(null, ['a'])).toBeNull();
    });
  });

  describe('selectFields', () => {
    it('should select only specified fields', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const result = selectFields(obj, ['a', 'c']);

      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should ignore non-existent fields', () => {
      const obj = { a: 1, b: 2 };
      const result = selectFields(obj, ['a', 'nonexistent']);

      expect(result).toEqual({ a: 1 });
    });
  });

  describe('toPublicUser', () => {
    it('should return only public user fields', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test',
        password: 'secret',
        reset_token: 'token',
        is_admin: false,
        couple_id: 5,
        role: 'member',
        created_at: new Date(),
        internal_field: 'should be removed',
      };

      const publicUser = toPublicUser(user);

      expect(publicUser).toHaveProperty('id');
      expect(publicUser).toHaveProperty('email');
      expect(publicUser).toHaveProperty('name');
      expect(publicUser).toHaveProperty('is_admin');
      expect(publicUser).toHaveProperty('couple_id');
      expect(publicUser).toHaveProperty('role');
      expect(publicUser).toHaveProperty('created_at');
      expect(publicUser).not.toHaveProperty('password');
      expect(publicUser).not.toHaveProperty('reset_token');
      expect(publicUser).not.toHaveProperty('internal_field');
    });
  });

  describe('Property-Based Tests - Sensitive Data Removal', () => {
    /**
     * Property: Sanitized user objects never contain sensitive fields
     * **Feature: project-optimization, Property: Sensitive Field Exclusion**
     * **Validates: Requirements 9.3**
     */
    it('should never expose password field regardless of input', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1 }),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            password: fc.string({ minLength: 1 }),
            created_at: fc.date(),
          }),
          (user) => {
            const sanitized = sanitizeUser(user);
            return sanitized !== null && !('password' in sanitized);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Sanitized user preserves non-sensitive fields
     * **Feature: project-optimization, Property: Non-Sensitive Field Preservation**
     * **Validates: Requirements 9.3**
     */
    it('should preserve non-sensitive fields after sanitization', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1 }),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            password: fc.string({ minLength: 1 }),
          }),
          (user) => {
            const sanitized = sanitizeUser(user);
            return (
              sanitized !== null &&
              sanitized.id === user.id &&
              sanitized.email === user.email &&
              sanitized.name === user.name
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: selectFields returns subset of original object
     * **Feature: project-optimization, Property: Field Selection Subset**
     * **Validates: Requirements 9.3**
     */
    it('should return subset when selecting fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            a: fc.integer(),
            b: fc.string(),
            c: fc.boolean(),
            d: fc.float(),
          }),
          fc.subarray(['a', 'b', 'c', 'd']),
          (obj, fields) => {
            const result = selectFields(obj, fields);
            if (result === null) return false;
            
            // All keys in result should be from the selected fields
            const resultKeys = Object.keys(result);
            return resultKeys.every(key => fields.includes(key));
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
