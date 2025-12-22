/**
 * Property-Based Tests for JWT Token Generation
 * 
 * **Feature: project-optimization, Property 3: JWT Expiration Validity**
 * **Validates: Requirements 7.2**
 * 
 * Property: For any issued JWT access token, the `exp` claim should be set 
 * to a time no more than 24 hours from the `iat` (issued at) time.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken, JWT_ACCESS_EXPIRES_MS, JWT_REFRESH_EXPIRES_MS } from './jwt';

interface JWTPayload {
  id: number;
  email?: string;
  iat: number;
  exp: number;
}

describe('JWT Token - Property Based Tests', () => {
  /**
   * **Feature: project-optimization, Property 3: JWT Expiration Validity**
   * **Validates: Requirements 7.2**
   * 
   * Property: For any issued JWT access token, the `exp` claim should be set 
   * to a time no more than 24 hours (1 hour as per design) from the `iat` time.
   */
  describe('Property 3: JWT Expiration Validity', () => {
    it('should set access token expiration within 1 hour (3600 seconds) of issued time', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }), // userId
          fc.emailAddress(), // email
          (userId, email) => {
            const token = generateAccessToken(userId, email);
            const decoded = jwt.decode(token) as JWTPayload;
            
            // Token should be decodable
            expect(decoded).not.toBeNull();
            expect(decoded.id).toBe(userId);
            expect(decoded.email).toBe(email);
            
            // exp should be defined
            expect(decoded.exp).toBeDefined();
            expect(decoded.iat).toBeDefined();
            
            // Calculate the difference between exp and iat
            const expirationDuration = decoded.exp - decoded.iat;
            
            // Access token should expire within 1 hour (3600 seconds)
            // Allow small tolerance for test execution time
            const maxExpiration = 3600; // 1 hour in seconds
            expect(expirationDuration).toBeLessThanOrEqual(maxExpiration);
            expect(expirationDuration).toBeGreaterThan(0);
            
            // Also verify it's within 24 hours as per Requirements 7.2
            const maxAllowedExpiration = 24 * 60 * 60; // 24 hours in seconds
            expect(expirationDuration).toBeLessThanOrEqual(maxAllowedExpiration);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set refresh token expiration within 7 days of issued time', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }), // userId
          (userId) => {
            const token = generateRefreshToken(userId);
            const decoded = jwt.decode(token) as JWTPayload;
            
            // Token should be decodable
            expect(decoded).not.toBeNull();
            expect(decoded.id).toBe(userId);
            
            // exp should be defined
            expect(decoded.exp).toBeDefined();
            expect(decoded.iat).toBeDefined();
            
            // Calculate the difference between exp and iat
            const expirationDuration = decoded.exp - decoded.iat;
            
            // Refresh token should expire within 7 days (604800 seconds)
            const maxExpiration = 7 * 24 * 60 * 60; // 7 days in seconds
            expect(expirationDuration).toBeLessThanOrEqual(maxExpiration);
            expect(expirationDuration).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent expiration times across multiple token generations', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }),
          fc.emailAddress(),
          (userId, email) => {
            // Generate multiple tokens
            const tokens = Array.from({ length: 5 }, () => 
              generateAccessToken(userId, email)
            );
            
            const expirations = tokens.map(token => {
              const decoded = jwt.decode(token) as JWTPayload;
              return decoded.exp - decoded.iat;
            });
            
            // All tokens should have the same expiration duration (within 1 second tolerance)
            const firstExpiration = expirations[0];
            expirations.forEach(exp => {
              expect(Math.abs(exp - firstExpiration)).toBeLessThanOrEqual(1);
            });
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('JWT Token Structure', () => {
    it('should generate valid JWT tokens with required claims', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }),
          fc.emailAddress(),
          (userId, email) => {
            const accessToken = generateAccessToken(userId, email);
            const refreshToken = generateRefreshToken(userId);
            
            // Tokens should be valid JWT format (3 parts separated by dots)
            expect(accessToken.split('.').length).toBe(3);
            expect(refreshToken.split('.').length).toBe(3);
            
            // Access token should contain user id and email
            const accessDecoded = jwt.decode(accessToken) as JWTPayload;
            expect(accessDecoded.id).toBe(userId);
            expect(accessDecoded.email).toBe(email);
            
            // Refresh token should contain user id
            const refreshDecoded = jwt.decode(refreshToken) as JWTPayload;
            expect(refreshDecoded.id).toBe(userId);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Exported Constants', () => {
    it('should export correct expiration times in milliseconds', () => {
      // Access token: 1 hour = 3600000 ms
      expect(JWT_ACCESS_EXPIRES_MS).toBe(60 * 60 * 1000);
      
      // Refresh token: 7 days = 604800000 ms
      expect(JWT_REFRESH_EXPIRES_MS).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });
});
