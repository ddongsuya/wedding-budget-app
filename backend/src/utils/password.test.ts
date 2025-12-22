/**
 * Property-Based Tests for Password Hashing Security
 * 
 * **Feature: project-optimization, Property 4: Password Hash Security**
 * **Validates: Requirements 7.5**
 * 
 * Property: For any stored password hash, it should be a valid bcrypt hash 
 * with a cost factor of at least 10.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import bcrypt from 'bcryptjs';
import { BCRYPT_COST_FACTOR } from '../controllers/authController';

/**
 * Extract bcrypt cost factor from hash
 * Bcrypt hash format: $2a$XX$... where XX is the cost factor
 */
function extractCostFactor(hash: string): number {
  const match = hash.match(/^\$2[aby]?\$(\d{2})\$/);
  if (!match) {
    throw new Error('Invalid bcrypt hash format');
  }
  return parseInt(match[1], 10);
}

/**
 * Validate bcrypt hash format
 */
function isValidBcryptHash(hash: string): boolean {
  // Bcrypt hash format: $2a$XX$<22 char salt><31 char hash>
  // Total length should be 60 characters
  const bcryptRegex = /^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/;
  return bcryptRegex.test(hash);
}

describe('Password Hash Security - Property Based Tests', () => {
  /**
   * **Feature: project-optimization, Property 4: Password Hash Security**
   * **Validates: Requirements 7.5**
   * 
   * Property: For any stored password hash, it should be a valid bcrypt hash 
   * with a cost factor of at least 10.
   */
  describe('Property 4: Password Hash Security', () => {
    it('should use bcrypt cost factor of at least 10 for any password', async () => {
      // Generate random passwords and verify hash properties
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 100 }), // password
          async (password) => {
            // Hash the password using the same cost factor as the application
            const hash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
            
            // Verify hash is valid bcrypt format
            expect(isValidBcryptHash(hash)).toBe(true);
            
            // Extract and verify cost factor
            const costFactor = extractCostFactor(hash);
            expect(costFactor).toBeGreaterThanOrEqual(10);
            
            // Verify the hash can be used to verify the original password
            const isMatch = await bcrypt.compare(password, hash);
            expect(isMatch).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 50 } // Reduced runs due to bcrypt being slow
      );
    });

    it('should produce different hashes for the same password (salt uniqueness)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 50 }),
          async (password) => {
            // Generate two hashes for the same password
            const hash1 = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
            const hash2 = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
            
            // Hashes should be different due to unique salts
            expect(hash1).not.toBe(hash2);
            
            // But both should verify against the original password
            expect(await bcrypt.compare(password, hash1)).toBe(true);
            expect(await bcrypt.compare(password, hash2)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not match incorrect passwords', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 50 }),
          fc.string({ minLength: 8, maxLength: 50 }),
          async (password1, password2) => {
            // Skip if passwords happen to be the same
            if (password1 === password2) return true;
            
            const hash = await bcrypt.hash(password1, BCRYPT_COST_FACTOR);
            
            // Wrong password should not match
            const isMatch = await bcrypt.compare(password2, hash);
            expect(isMatch).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should have BCRYPT_COST_FACTOR constant set to at least 10', () => {
      expect(BCRYPT_COST_FACTOR).toBeGreaterThanOrEqual(10);
      // Our implementation uses 12
      expect(BCRYPT_COST_FACTOR).toBe(12);
    });
  });

  describe('Bcrypt Hash Format Validation', () => {
    it('should produce valid bcrypt hash format for any password', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 72 }), // bcrypt max input is 72 bytes
          async (password) => {
            const hash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
            
            // Hash should be exactly 60 characters
            expect(hash.length).toBe(60);
            
            // Hash should start with $2a$ or $2b$
            expect(hash).toMatch(/^\$2[ab]\$/);
            
            // Hash should be valid format
            expect(isValidBcryptHash(hash)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
