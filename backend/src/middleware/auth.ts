import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AuthRequest } from '../types';
import { pool } from '../config/database';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token) as { id: number; email: string };

    // 커플 ID 조회
    const coupleResult = await pool.query(
      'SELECT id FROM couples WHERE user1_id = $1 OR user2_id = $1',
      [decoded.id]
    );

    req.user = {
      id: decoded.id,
      email: decoded.email,
      coupleId: coupleResult.rows[0]?.id,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
