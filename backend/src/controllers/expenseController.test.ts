/**
 * Tests for Expense Controller - Monthly Summary & CSV Export
 * Requirements 5.1: 월별 지출 추이 차트 데이터
 * Requirements 5.4: 지출 CSV 내보내기
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response } from 'express';
import { AuthRequest } from '../types';

// Mock the database pool
vi.mock('../config/database', () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock('../utils/upload', () => ({
  optimizeImage: vi.fn(),
}));

vi.mock('../services/coupleNotificationService', () => ({
  notifyExpenseChange: vi.fn(),
}));

import { pool } from '../config/database';
import { getMonthlySummary, exportExpenses } from './expenseController';

function createMockReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    user: { id: 1, email: 'test@test.com', coupleId: 10 },
    query: {},
    params: {},
    body: {},
    ...overrides,
  } as unknown as AuthRequest;
}

function createMockRes(): Response {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis() as any,
    json: vi.fn().mockReturnThis() as any,
    send: vi.fn().mockReturnThis() as any,
    setHeader: vi.fn().mockReturnThis() as any,
  };
  return res as Response;
}

describe('getMonthlySummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return monthly summary for the last 6 months', async () => {
    const mockRows = [
      { month: '2025-01', total: 500000 },
      { month: '2025-02', total: 300000 },
      { month: '2025-03', total: 750000 },
    ];
    (pool.query as any).mockResolvedValue({ rows: mockRows });

    const req = createMockReq();
    const res = createMockRes();

    await getMonthlySummary(req, res);

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ summary: mockRows });
  });

  it('should return 404 when no couple found', async () => {
    const req = createMockReq({ user: { id: 1, email: 'test@test.com', coupleId: undefined } } as any);
    const res = createMockRes();

    await getMonthlySummary(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No couple found' });
  });

  it('should return empty array when no expenses exist', async () => {
    (pool.query as any).mockResolvedValue({ rows: [] });

    const req = createMockReq();
    const res = createMockRes();

    await getMonthlySummary(req, res);

    expect(res.json).toHaveBeenCalledWith({ summary: [] });
  });

  it('should return 500 on database error', async () => {
    (pool.query as any).mockRejectedValue(new Error('DB error'));

    const req = createMockReq();
    const res = createMockRes();

    await getMonthlySummary(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});

describe('exportExpenses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return CSV with correct headers and data', async () => {
    const mockRows = [
      {
        title: '웨딩홀 계약금',
        amount: 5000000,
        date: new Date('2025-03-15'),
        category_name: '예식장',
        payment_method: '계좌이체',
        status: 'completed',
        notes: '1차 계약금',
      },
      {
        title: '드레스 대여',
        amount: 2000000,
        date: new Date('2025-04-01'),
        category_name: '의상',
        payment_method: '카드',
        status: 'planned',
        notes: null,
      },
    ];
    (pool.query as any).mockResolvedValue({ rows: mockRows });

    const req = createMockReq();
    const res = createMockRes();

    await exportExpenses(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=expenses.csv');

    const csvContent = (res.send as any).mock.calls[0][0];
    expect(csvContent).toContain('제목,금액,날짜,카테고리,결제방법,상태,메모');
    expect(csvContent).toContain('웨딩홀 계약금');
    expect(csvContent).toContain('5000000');
    expect(csvContent).toContain('2025-03-15');
    expect(csvContent).toContain('예식장');
    expect(csvContent).toContain('결제완료');
    expect(csvContent).toContain('드레스 대여');
    expect(csvContent).toContain('결제예정');
  });

  it('should handle CSV special characters by escaping', async () => {
    const mockRows = [
      {
        title: '메모에, 쉼표가 있는 항목',
        amount: 100000,
        date: new Date('2025-01-01'),
        category_name: '기타',
        payment_method: '현금',
        status: 'completed',
        notes: '쉼표, 포함 "따옴표" 포함',
      },
    ];
    (pool.query as any).mockResolvedValue({ rows: mockRows });

    const req = createMockReq();
    const res = createMockRes();

    await exportExpenses(req, res);

    const csvContent = (res.send as any).mock.calls[0][0];
    // Title with comma should be quoted
    expect(csvContent).toContain('"메모에, 쉼표가 있는 항목"');
    // Notes with comma and quotes should be escaped
    expect(csvContent).toContain('"쉼표, 포함 ""따옴표"" 포함"');
  });

  it('should return 404 when no couple found', async () => {
    const req = createMockReq({ user: { id: 1, email: 'test@test.com', coupleId: undefined } } as any);
    const res = createMockRes();

    await exportExpenses(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No couple found' });
  });

  it('should handle empty expense list', async () => {
    (pool.query as any).mockResolvedValue({ rows: [] });

    const req = createMockReq();
    const res = createMockRes();

    await exportExpenses(req, res);

    const csvContent = (res.send as any).mock.calls[0][0];
    expect(csvContent).toContain('제목,금액,날짜,카테고리,결제방법,상태,메모');
    // Only header, no data rows
    const lines = csvContent.split('\n').filter((l: string) => l.trim());
    expect(lines).toHaveLength(1);
  });

  it('should handle null values gracefully', async () => {
    const mockRows = [
      {
        title: '테스트',
        amount: 10000,
        date: null,
        category_name: null,
        payment_method: null,
        status: null,
        notes: null,
      },
    ];
    (pool.query as any).mockResolvedValue({ rows: mockRows });

    const req = createMockReq();
    const res = createMockRes();

    await exportExpenses(req, res);

    const csvContent = (res.send as any).mock.calls[0][0];
    expect(csvContent).toContain('테스트');
    // Should not throw, null values become empty strings
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('should return 500 on database error', async () => {
    (pool.query as any).mockRejectedValue(new Error('DB error'));

    const req = createMockReq();
    const res = createMockRes();

    await exportExpenses(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
