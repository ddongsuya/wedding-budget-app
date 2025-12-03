import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../types';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user?.coupleId;

    // 커플이 연결되지 않은 경우 빈 프로필 반환
    if (!coupleId) {
      return res.json({ 
        profile: null,
        message: '커플이 연결되지 않았습니다. 설정에서 커플을 연결해주세요.'
      });
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

    // 빈 문자열을 null로 변환 (날짜 필드용)
    const toNullIfEmpty = (val: any) => (val === '' || val === undefined ? null : val);

    const groom_name = toNullIfEmpty(req.body.groom_name);
    const groom_birth_date = toNullIfEmpty(req.body.groom_birth_date);
    const groom_contact = toNullIfEmpty(req.body.groom_contact);
    const bride_name = toNullIfEmpty(req.body.bride_name);
    const bride_birth_date = toNullIfEmpty(req.body.bride_birth_date);
    const bride_contact = toNullIfEmpty(req.body.bride_contact);
    const first_met_date = toNullIfEmpty(req.body.first_met_date);
    const wedding_date = toNullIfEmpty(req.body.wedding_date);
    const couple_nickname = toNullIfEmpty(req.body.couple_nickname);

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
      // 업데이트 - 값을 직접 설정
      result = await pool.query(
        `UPDATE couple_profiles SET
          groom_name = $2,
          groom_birth_date = $3,
          groom_contact = $4,
          bride_name = $5,
          bride_birth_date = $6,
          bride_contact = $7,
          first_met_date = $8,
          wedding_date = $9,
          couple_nickname = $10,
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
  } catch (error: any) {
    console.error('Update profile error:', error);
    console.error('Error message:', error.message);
    console.error('Error detail:', error.detail);
    res.status(500).json({ error: 'Internal server error', detail: error.message });
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

    // 이미지를 Base64로 변환
    const fs = await import('fs');
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
    
    // 임시 파일 삭제
    fs.unlinkSync(req.file.path);

    // 프로필 업데이트
    const result = await pool.query(
      `INSERT INTO couple_profiles (couple_id, groom_image)
       VALUES ($1, $2)
       ON CONFLICT (couple_id) DO UPDATE
       SET groom_image = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [coupleId, base64Image]
    );

    res.json({ profile: result.rows[0], imageUrl: base64Image });
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

    // 이미지를 Base64로 변환
    const fs = await import('fs');
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
    
    // 임시 파일 삭제
    fs.unlinkSync(req.file.path);

    const result = await pool.query(
      `INSERT INTO couple_profiles (couple_id, bride_image)
       VALUES ($1, $2)
       ON CONFLICT (couple_id) DO UPDATE
       SET bride_image = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [coupleId, base64Image]
    );

    res.json({ profile: result.rows[0], imageUrl: base64Image });
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

    // 이미지를 Base64로 변환
    const fs = await import('fs');
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
    
    // 임시 파일 삭제
    fs.unlinkSync(req.file.path);

    const result = await pool.query(
      `INSERT INTO couple_profiles (couple_id, couple_photo)
       VALUES ($1, $2)
       ON CONFLICT (couple_id) DO UPDATE
       SET couple_photo = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [coupleId, base64Image]
    );

    res.json({ profile: result.rows[0], imageUrl: base64Image });
  } catch (error) {
    console.error('Upload couple image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
