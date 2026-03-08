/**
 * Tests for Account Deletion API (deleteAccount)
 * Requirements 7.4: 계정 삭제(회원 탈퇴) 기능 - 2단계 확인 절차
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response } from 'express';
import { AuthRequest } from '../types';

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

// Mock database
const mockClient = {
  query: vi.fn(),
};

vi.mock('../config/database', () => ({
  pool: {
    query: vi.fn(),
  },
  withTransaction: vi.fn(async (cb: (client: any) => Promise<any>) => {
    return cb(mockClient);
  }),
}));

vi.mock('../utils/jwt', () => ({
  generateAccessToken: vi.fn(() => 'mock-access-token'),
  generateRefreshToken: vi.fn(() => 'mock-refresh-token'),
  verifyRefreshToken: vi.fn(),
  JWT_ACCESS_EXPIRES_MS: 3600000,
  JWT_REFRESH_EXPIRES_MS: 604800000,
}));

vi.mock('../middleware/rateLimiter', () => ({
  recordLoginFailure: vi.fn(),
  clearLoginAttempts: vi.fn(),
}));

vi.mock('../middleware/security', () => ({
  validatePassword: vi.fn(() => ({ isValid: true, errors: [] })),
  isValidEmail: vi.fn(() => true),
  sanitizeInput: vi.fn((v: string) => v),
}));

vi.mock('../utils/errorResponse', () => ({
  sendBadRequest: vi.fn((res: any, msg: string) => res.status(400).json({ success: false, message: msg })),
  sendUnauthorized: vi.fn((res: any, msg: string) => res.status(401).json({ success: false, message: msg })),
  sendNotFound: vi.fn((res: any, msg: string) => res.status(404).json({ success: false, message: msg })),
  sendInternalError: vi.fn((res: any, msg: string) => res.status(500).json({ success: false, message: msg })),
  sendConflict: vi.fn(),
  handleDatabaseError: vi.fn((res: any, _err: any, msg: string) => res.status(500).json({ success: false, message: msg })),
  ErrorCodes: {
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
  },
}));

import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import { deleteAccount } from './authController';

function createMockReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    user: { id: 1, email: 'test@test.com', coupleId: 10 },
    query: {},
    params: {},
    body: {},
    cookies: {},
    ...overrides,
  } as unknown as AuthRequest;
}

function createMockRes(): Response {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis() as any,
    json: vi.fn().mockReturnThis() as any,
    clearCookie: vi.fn().mockReturnThis() as any,
    cookie: vi.fn().mockReturnThis() as any,
  };
  return res as Response;
}

describe('deleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete account successfully with valid password', async () => {
    (pool.query as any).mockResolvedValue({
      rows: [{ password: '$2a$12$hashedpassword' }],
    });
    (bcrypt.compare as any).mockResolvedValue(true);
    mockClient.query.mockResolvedValue({ rows: [] });

    const req = createMockReq({ body: { password: 'validPassword123' } });
    const res = createMockRes();

    await deleteAccount(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: '계정이 성공적으로 삭제되었습니다',
    });
    expect(res.clearCookie).toHaveBeenCalledWith('accessToken', { path: '/' });
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/api/auth' });
  });

  it('should return 400 when password is missing', async () => {
    const req = createMockReq({ body: {} });
    const res = createMockRes();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 404 when user not found in database', async () => {
    (pool.query as any).mockResolvedValue({ rows: [] });

    const req = createMockReq({ body: { password: 'somePassword123' } });
    const res = createMockRes();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 401 when password is incorrect', async () => {
    (pool.query as any).mockResolvedValue({
      rows: [{ password: '$2a$12$hashedpassword' }],
    });
    (bcrypt.compare as any).mockResolvedValue(false);

    const req = createMockReq({ body: { password: 'wrongPassword123' } });
    const res = createMockRes();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should handle couple with partner (only unlink, not delete couple)', async () => {
    (pool.query as any).mockResolvedValue({
      rows: [{ password: '$2a$12$hashedpassword' }],
    });
    (bcrypt.compare as any).mockResolvedValue(true);

    // First call: check for other users in couple → found partner
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // otherUser exists
      .mockResolvedValueOnce({ rows: [] }) // UPDATE users SET couple_id = NULL
      .mockResolvedValueOnce({ rows: [] }); // DELETE FROM users

    const req = createMockReq({ body: { password: 'validPassword123' } });
    const res = createMockRes();

    await deleteAccount(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: '계정이 성공적으로 삭제되었습니다',
    });
  });

  it('should handle couple without partner (delete couple entirely)', async () => {
    (pool.query as any).mockResolvedValue({
      rows: [{ password: '$2a$12$hashedpassword' }],
    });
    (bcrypt.compare as any).mockResolvedValue(true);

    // No other user in couple
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // otherUser not found
      .mockResolvedValueOnce({ rows: [] }) // DELETE couple_profiles
      .mockResolvedValueOnce({ rows: [] }) // DELETE couples
      .mockResolvedValueOnce({ rows: [] }); // DELETE users

    const req = createMockReq({ body: { password: 'validPassword123' } });
    const res = createMockRes();

    await deleteAccount(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: '계정이 성공적으로 삭제되었습니다',
    });
  });

  it('should return 500 on database error during deletion', async () => {
    (pool.query as any).mockResolvedValue({
      rows: [{ password: '$2a$12$hashedpassword' }],
    });
    (bcrypt.compare as any).mockResolvedValue(true);
    mockClient.query.mockRejectedValue(new Error('DB error'));

    const req = createMockReq({ body: { password: 'validPassword123' } });
    const res = createMockRes();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
