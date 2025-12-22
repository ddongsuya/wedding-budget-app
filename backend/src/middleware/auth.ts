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
    // Try to get token from cookie first, then from Authorization header (backward compatibility)
    let token = req.cookies?.accessToken;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    console.log('[AUTH] Request URL:', req.originalUrl);
    console.log('[AUTH] Token source:', req.cookies?.accessToken ? 'cookie' : 'header');

    if (!token) {
      console.log('[AUTH] No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('[AUTH] Token length:', token.length);
    console.log('[AUTH] Token preview:', token.substring(0, 20) + '...');
    
    const decoded = verifyAccessToken(token) as { id: number; email: string };
    console.log('[AUTH] Decoded user ID:', decoded.id);

    // 사용자 정보 및 커플 ID 조회
    const userResult = await pool.query(
      'SELECT couple_id, is_admin FROM users WHERE id = $1',
      [decoded.id]
    );

    req.user = {
      id: decoded.id,
      email: decoded.email,
      coupleId: userResult.rows[0]?.couple_id,
      isAdmin: userResult.rows[0]?.is_admin || false,
    };

    console.log('[AUTH] Success for user:', decoded.email);
    next();
  } catch (error: any) {
    console.log('[AUTH] Error:', error.message);
    console.log('[AUTH] JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('[AUTH] JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
