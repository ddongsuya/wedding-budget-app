/**
 * Tests for Photo Reference Controller - Update & Reorder API
 * Requirements 11.1: 사진 수정 기능 (제목, 메모, 카테고리, 태그 변경)
 * Requirements 11.3: 사진 순서 드래그 앤 드롭 변경
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response } from 'express';
import { AuthRequest } from '../types';

const mockPoolClient = {
  query: vi.fn(),
  release: vi.fn(),
};

vi.mock('../config/database', () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(() => mockPoolClient),
  },
}));

import { pool } from '../config/database';
import { updatePhotoReference, reorderPhotoReferences } from './photoReferenceController';

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
  };
  return res as Response;
}

describe('updatePhotoReference', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update photo reference successfully', async () => {
    const updatedPhoto = {
      id: 5,
      couple_id: 10,
      category: 'outdoor',
      title: '수정된 제목',
      memo: '수정된 메모',
      tags: ['웨딩', '야외'],
      is_favorite: true,
    };
    (pool.query as any).mockResolvedValue({ rows: [updatedPhoto] });

    const req = createMockReq({
      params: { id: '5' },
      body: {
        category: 'outdoor',
        title: '수정된 제목',
        memo: '수정된 메모',
        tags: ['웨딩', '야외'],
        is_favorite: true,
      },
    });
    const res = createMockRes();

    await updatePhotoReference(req, res);

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: updatedPhoto,
    });
  });

  it('should return 404 when no couple found', async () => {
    const req = createMockReq({
      user: { id: 1, email: 'test@test.com', coupleId: undefined },
      params: { id: '5' },
      body: { title: 'new title' },
    } as any);
    const res = createMockRes();

    await updatePhotoReference(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No couple found' });
  });

  it('should return 404 when photo not found', async () => {
    (pool.query as any).mockResolvedValue({ rows: [] });

    const req = createMockReq({
      params: { id: '999' },
      body: { title: 'new title' },
    });
    const res = createMockRes();

    await updatePhotoReference(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Photo not found' });
  });

  it('should handle partial updates (only title)', async () => {
    const updatedPhoto = { id: 5, title: '새 제목만 변경' };
    (pool.query as any).mockResolvedValue({ rows: [updatedPhoto] });

    const req = createMockReq({
      params: { id: '5' },
      body: { title: '새 제목만 변경' },
    });
    const res = createMockRes();

    await updatePhotoReference(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: updatedPhoto,
    });
  });

  it('should return 500 on database error', async () => {
    (pool.query as any).mockRejectedValue(new Error('DB error'));

    const req = createMockReq({
      params: { id: '5' },
      body: { title: 'test' },
    });
    const res = createMockRes();

    await updatePhotoReference(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});

describe('reorderPhotoReferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPoolClient.query.mockResolvedValue({ rows: [] });
  });

  it('should reorder photos successfully', async () => {
    const req = createMockReq({
      body: {
        orders: [
          { id: 1, sort_order: 0 },
          { id: 2, sort_order: 1 },
          { id: 3, sort_order: 2 },
        ],
      },
    });
    const res = createMockRes();

    await reorderPhotoReferences(req, res);

    // BEGIN + 3 updates + COMMIT = 5 calls
    expect(mockPoolClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockPoolClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockPoolClient.query).toHaveBeenCalledTimes(5);
    expect(mockPoolClient.release).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Photo order updated successfully',
    });
  });

  it('should return 404 when no couple found', async () => {
    const req = createMockReq({
      user: { id: 1, email: 'test@test.com', coupleId: undefined },
      body: { orders: [{ id: 1, sort_order: 0 }] },
    } as any);
    const res = createMockRes();

    await reorderPhotoReferences(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No couple found' });
  });

  it('should return 400 when orders array is missing', async () => {
    const req = createMockReq({ body: {} });
    const res = createMockRes();

    await reorderPhotoReferences(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'orders array is required' });
  });

  it('should return 400 when orders array is empty', async () => {
    const req = createMockReq({ body: { orders: [] } });
    const res = createMockRes();

    await reorderPhotoReferences(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'orders array is required' });
  });

  it('should rollback on database error during reorder', async () => {
    mockPoolClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockRejectedValueOnce(new Error('Update failed')); // first update fails

    const req = createMockReq({
      body: {
        orders: [{ id: 1, sort_order: 0 }],
      },
    });
    const res = createMockRes();

    await reorderPhotoReferences(req, res);

    expect(mockPoolClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockPoolClient.release).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
