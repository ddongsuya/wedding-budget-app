import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import { AuthRequest } from '../types';

export const createInvite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // 이미 커플이 있는지 확인
    const existingCouple = await pool.query(
      'SELECT id FROM couples WHERE user1_id = $1 OR user2_id = $1',
      [userId]
    );

    if (existingCouple.rows.length > 0) {
      return res.status(400).json({ error: 'Already in a couple' });
    }

    // 초대 코드 생성
    const inviteCode = uuidv4().substring(0, 8).toUpperCase();

    // 커플 생성
    const result = await pool.query(
      'INSERT INTO couples (user1_id, invite_code) VALUES ($1, $2) RETURNING id, invite_code, created_at',
      [userId, inviteCode]
    );

    // 예산 설정 초기화
    await pool.query(
      'INSERT INTO budget_settings (couple_id) VALUES ($1)',
      [result.rows[0].id]
    );

    res.status(201).json({
      couple: result.rows[0],
      inviteCode,
    });
  } catch (error) {
    console.error('Create invite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const joinCouple = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { inviteCode } = req.body;

    // 이미 커플이 있는지 확인
    const existingCouple = await pool.query(
      'SELECT id FROM couples WHERE user1_id = $1 OR user2_id = $1',
      [userId]
    );

    if (existingCouple.rows.length > 0) {
      return res.status(400).json({ error: 'Already in a couple' });
    }

    // 초대 코드로 커플 찾기
    const coupleResult = await pool.query(
      'SELECT * FROM couples WHERE invite_code = $1 AND user2_id IS NULL',
      [inviteCode]
    );

    if (coupleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired invite code' });
    }

    const couple = coupleResult.rows[0];

    if (couple.user1_id === userId) {
      return res.status(400).json({ error: 'Cannot join your own invite' });
    }

    // 커플 연결
    const result = await pool.query(
      'UPDATE couples SET user2_id = $1, invite_code = NULL WHERE id = $2 RETURNING *',
      [userId, couple.id]
    );

    res.json({ couple: result.rows[0] });
  } catch (error) {
    console.error('Join couple error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCouple = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await pool.query(
      `SELECT c.*, 
              u1.name as user1_name, u1.email as user1_email,
              u2.name as user2_name, u2.email as user2_email
       FROM couples c
       LEFT JOIN users u1 ON c.user1_id = u1.id
       LEFT JOIN users u2 ON c.user2_id = u2.id
       WHERE c.user1_id = $1 OR c.user2_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No couple found' });
    }

    res.json({ couple: result.rows[0] });
  } catch (error) {
    console.error('Get couple error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
