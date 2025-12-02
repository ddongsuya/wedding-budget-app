import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../types';
import { optimizeImage } from '../utils/upload';
import path from 'path';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const result = await pool.query(
      'SELECT * FROM couple_profiles WHERE couple_id = $1',
      [coupleId]
    );

    if (result.rows.length === 0) {
      return res.json({ profile: null });
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const {
      groom_name,
      groom_birth_date,
      groom_contact,
      bride_name,
      bride_birth_date,
      bride_contact,
      first_met_date,
      wedding_date,
      couple_nickname,
    } = req.body;

    // 프로필이 존재하는지 확인
    const existing = await pool.query(
      'SELECT id FROM couple_profiles WHERE couple_id = $1',
      [coupleId]
    );

    let result;
    if (existing.rows.length === 0) {
      // 새로 생성
      result = await pool.query(
        `INSERT INTO couple_profiles (
          couple_id, groom_name, groom_birth_date, groom_contact,
          bride_name, bride_birth_date, bride_contact,
          first_met_date, wedding_date, couple_nickname
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          coupleId,
          groom_name,
          groom_birth_date,
          groom_contact,
          bride_name,
          bride_birth_date,
          bride_contact,
          first_met_date,
          wedding_date,
          couple_nickname,
        ]
      );
    } else {
      // 업데이트
      result = await pool.query(
        `UPDATE couple_profiles SET
          groom_name = COALESCE($2, groom_name),
          groom_birth_date = COALESCE($3, groom_birth_date),
          groom_contact = COALESCE($4, groom_contact),
          bride_name = COALESCE($5, bride_name),
          bride_birth_date = COALESCE($6, bride_birth_date),
          bride_contact = COALESCE($7, bride_contact),
          first_met_date = COALESCE($8, first_met_date),
          wedding_date = COALESCE($9, wedding_date),
          couple_nickname = COALESCE($10, couple_nickname),
          updated_at = CURRENT_TIMESTAMP
        WHERE couple_id = $1
        RETURNING *`,
        [
          coupleId,
          groom_name,
          groom_birth_date,
          groom_contact,
          bride_name,
          bride_birth_date,
          bride_contact,
          first_met_date,
          wedding_date,
          couple_nickname,
        ]
      );
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadGroomImage = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 이미지 최적화
    await optimizeImage(req.file.path, 800, 85);

    const imageUrl = `/uploads/${req.file.filename}`;

    // 프로필 업데이트
    const result = await pool.query(
      `INSERT INTO couple_profiles (couple_id, groom_image)
       VALUES ($1, $2)
       ON CONFLICT (couple_id) DO UPDATE
       SET groom_image = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [coupleId, imageUrl]
    );

    res.json({ profile: result.rows[0], imageUrl });
  } catch (error) {
    console.error('Upload groom image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadBrideImage = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    await optimizeImage(req.file.path, 800, 85);

    const imageUrl = `/uploads/${req.file.filename}`;

    const result = await pool.query(
      `INSERT INTO couple_profiles (couple_id, bride_image)
       VALUES ($1, $2)
       ON CONFLICT (couple_id) DO UPDATE
       SET bride_image = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [coupleId, imageUrl]
    );

    res.json({ profile: result.rows[0], imageUrl });
  } catch (error) {
    console.error('Upload bride image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadCoupleImage = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    await optimizeImage(req.file.path, 1200, 85);

    const imageUrl = `/uploads/${req.file.filename}`;

    const result = await pool.query(
      `INSERT INTO couple_profiles (couple_id, couple_photo)
       VALUES ($1, $2)
       ON CONFLICT (couple_id) DO UPDATE
       SET couple_photo = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [coupleId, imageUrl]
    );

    res.json({ profile: result.rows[0], imageUrl });
  } catch (error) {
    console.error('Upload couple image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
