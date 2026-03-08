/**
 * Tests for Backup Controller - Export & Import API
 * Requirements 7.2: 전체 데이터 백업(내보내기) 기능
 * Requirements 7.3: 데이터 복원(가져오기) 기능
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response } from 'express';
import { AuthRequest } from '../types';

// Mock the database pool and withTransaction
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

import { pool } from '../config/database';
import { exportData, importData } from './backupController';

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
    setHeader: vi.fn().mockReturnThis() as any,
  };
  return res as Response;
}

describe('exportData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export all user data as JSON', async () => {
    const mockBudget = { rows: [{ total_budget: 50000000, groom_ratio: 50, bride_ratio: 50 }] };
    const mockCategories = { rows: [{ id: 1, name: '예식장', budget_amount: 20000000 }] };
    const mockExpenses = { rows: [{ id: 1, title: '계약금', amount: 5000000 }] };
    const mockChecklistCategories = { rows: [] };
    const mockChecklistItems = { rows: [] };
    const mockEvents = { rows: [] };
    const mockVenues = { rows: [{ id: 1, name: '그랜드홀' }] };
    const mockVenueContracts = { rows: [] };
    const mockPhotoReferences = { rows: [] };

    (pool.query as any)
      .mockResolvedValueOnce(mockBudget)
      .mockResolvedValueOnce(mockCategories)
      .mockResolvedValueOnce(mockExpenses)
      .mockResolvedValueOnce(mockChecklistCategories)
      .mockResolvedValueOnce(mockChecklistItems)
      .mockResolvedValueOnce(mockEvents)
      .mockResolvedValueOnce(mockVenues)
      .mockResolvedValueOnce(mockVenueContracts)
      .mockResolvedValueOnce(mockPhotoReferences);

    const req = createMockReq();
    const res = createMockRes();

    await exportData(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('attachment; filename=wedding-backup-')
    );

    const jsonData = (res.json as any).mock.calls[0][0];
    expect(jsonData.version).toBe('1.0');
    expect(jsonData.exportedAt).toBeDefined();
    expect(jsonData.data.budget).toEqual(mockBudget.rows[0]);
    expect(jsonData.data.categories).toEqual(mockCategories.rows);
    expect(jsonData.data.expenses).toEqual(mockExpenses.rows);
    expect(jsonData.data.venues).toEqual(mockVenues.rows);
  });

  it('should return 404 when no couple found', async () => {
    const req = createMockReq({ user: { id: 1, email: 'test@test.com', coupleId: undefined } } as any);
    const res = createMockRes();

    await exportData(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No couple found' });
  });

  it('should return 500 on database error', async () => {
    (pool.query as any).mockRejectedValue(new Error('DB error'));

    const req = createMockReq();
    const res = createMockRes();

    await exportData(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: '데이터 내보내기에 실패했습니다' });
  });

  it('should handle empty data gracefully', async () => {
    const emptyResult = { rows: [] };
    (pool.query as any)
      .mockResolvedValueOnce(emptyResult) // budget
      .mockResolvedValueOnce(emptyResult) // categories
      .mockResolvedValueOnce(emptyResult) // expenses
      .mockResolvedValueOnce(emptyResult) // checklistCategories
      .mockResolvedValueOnce(emptyResult) // checklistItems
      .mockResolvedValueOnce(emptyResult) // events
      .mockResolvedValueOnce(emptyResult) // venues
      .mockResolvedValueOnce(emptyResult) // venueContracts
      .mockResolvedValueOnce(emptyResult); // photoReferences

    const req = createMockReq();
    const res = createMockRes();

    await exportData(req, res);

    const jsonData = (res.json as any).mock.calls[0][0];
    expect(jsonData.data.budget).toBeNull();
    expect(jsonData.data.categories).toEqual([]);
    expect(jsonData.data.expenses).toEqual([]);
  });
});

describe('importData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should import valid backup data successfully', async () => {
    // Mock category mapping query
    mockClient.query.mockResolvedValue({ rows: [{ id: 100, name: '예식장' }] });

    const req = createMockReq({
      body: {
        version: '1.0',
        data: {
          budget: { total_budget: 50000000, groom_ratio: 50, bride_ratio: 50 },
          categories: [{ name: '예식장', icon: '💒', budget_amount: 20000000, order: 0 }],
          expenses: [],
          checklistCategories: [],
          checklistItems: [],
          venues: [],
          venueContracts: [],
          events: [],
          photoReferences: [],
        },
      },
    });
    const res = createMockRes();

    await importData(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: '데이터를 성공적으로 가져왔습니다',
    });
    // Verify deletion queries were called (cleanup before import)
    expect(mockClient.query).toHaveBeenCalledWith(
      'DELETE FROM venue_contracts WHERE couple_id = $1',
      [10]
    );
  });

  it('should return 404 when no couple found', async () => {
    const req = createMockReq({
      user: { id: 1, email: 'test@test.com', coupleId: undefined },
      body: { version: '1.0', data: {} },
    } as any);
    const res = createMockRes();

    await importData(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No couple found' });
  });

  it('should return 400 for invalid backup format (missing version)', async () => {
    const req = createMockReq({
      body: { data: {} },
    });
    const res = createMockRes();

    await importData(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: '유효하지 않은 백업 파일입니다' });
  });

  it('should return 400 for invalid backup format (missing data)', async () => {
    const req = createMockReq({
      body: { version: '1.0' },
    });
    const res = createMockRes();

    await importData(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: '유효하지 않은 백업 파일입니다' });
  });

  it('should return 500 on transaction error', async () => {
    mockClient.query.mockRejectedValue(new Error('Transaction failed'));

    const req = createMockReq({
      body: {
        version: '1.0',
        data: {
          budget: null,
          categories: [],
          expenses: [],
        },
      },
    });
    const res = createMockRes();

    await importData(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: '데이터 가져오기에 실패했습니다' });
  });
});
