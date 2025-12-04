import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../types';

// 카테고리 목록
export const PHOTO_CATEGORIES = [
  { id: 'outdoor', name: '야외', icon: '🌳' },
  { id: 'indoor', name: '실내', icon: '🏠' },
  { id: 'pose', name: '포즈', icon: '💃' },
  { id: 'props', name: '소품', icon: '🎀' },
  { id: 'dress', name: '드레스', icon: '👗' },
  { id: 'suit', name: '수트', icon: '🤵' },
  { id: 'makeup', name: '메이크업', icon: '💄' },
  { id: 'etc', name: '기타', icon: '📷' },
];

// 레퍼런스 사진 목록 조회
export const getPhotoReferences = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const { category } = req.query;

    let query = 'SELECT * FROM photo_references WHERE couple_id = $1';
    const params: any[] = [coupleId];

    if (category) {
      query += ' AND category = $2';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      categories: PHOTO_CATEGORIES,
    });
  } catch (error) {
    console.error('Get photo references error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 레퍼런스 사진 추가
export const createPhotoReference = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const { image_url, category, title, memo, tags, source_url } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const result = await pool.query(
      `INSERT INTO photo_references (couple_id, image_url, category, title, memo, tags, source_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [coupleId, image_url, category || 'etc', title || '', memo || '', tags || [], source_url || null, req.user!.id]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create photo reference error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 레퍼런스 사진 수정
export const updatePhotoReference = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    const { id } = req.params;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const { category, title, memo, tags, is_favorite } = req.body;

    const result = await pool.query(
      `UPDATE photo_references SET
        category = COALESCE($3, category),
        title = COALESCE($4, title),
        memo = COALESCE($5, memo),
        tags = COALESCE($6, tags),
        is_favorite = COALESCE($7, is_favorite),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND couple_id = $2
       RETURNING *`,
      [id, coupleId, category, title, memo, tags, is_favorite]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update photo reference error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 레퍼런스 사진 삭제
export const deletePhotoReference = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    const { id } = req.params;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const result = await pool.query(
      'DELETE FROM photo_references WHERE id = $1 AND couple_id = $2 RETURNING id',
      [id, coupleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('Delete photo reference error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 즐겨찾기 토글
export const toggleFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    const { id } = req.params;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const result = await pool.query(
      `UPDATE photo_references SET
        is_favorite = NOT is_favorite,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND couple_id = $2
       RETURNING *`,
      [id, coupleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
