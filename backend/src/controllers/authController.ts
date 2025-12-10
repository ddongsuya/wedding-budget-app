import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool } from '../config/database';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../types';
import { recordLoginFailure, clearLoginAttempts } from '../middleware/rateLimiter';
import { validatePassword, isValidEmail, sanitizeInput } from '../middleware/security';

// 로그인 기록 저장
const recordLoginHistory = async (userId: number, ip: string, userAgent: string, success: boolean) => {
  try {
    await pool.query(
      `INSERT INTO login_history (user_id, ip_address, user_agent, success, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId, ip, userAgent?.substring(0, 500), success]
    );
  } catch (error) {
    console.error('Failed to record login history:', error);
  }
};

// Refresh Token을 DB에 저장
const saveRefreshToken = async (userId: number, token: string, expiresAt: Date) => {
  try {
    // 기존 토큰 삭제 (같은 사용자의 오래된 토큰)
    await pool.query(
      'DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at < NOW()',
      [userId]
    );
    
    // 새 토큰 저장
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, tokenHash, expiresAt]
    );
  } catch (error) {
    console.error('Failed to save refresh token:', error);
  }
};

// Refresh Token 검증
const validateRefreshToken = async (userId: number, token: string): Promise<boolean> => {
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await pool.query(
      `SELECT id FROM refresh_tokens 
       WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW() AND revoked = FALSE`,
      [userId, tokenHash]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Failed to validate refresh token:', error);
    return false;
  }
};

// Refresh Token 폐기
const revokeRefreshToken = async (userId: number, token: string) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await pool.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND token_hash = $2',
      [userId, tokenHash]
    );
  } catch (error) {
    console.error('Failed to revoke refresh token:', error);
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    // 입력 검증
    const sanitizedEmail = sanitizeInput(email?.toLowerCase());
    const sanitizedName = sanitizeInput(name);
    
    if (!isValidEmail(sanitizedEmail)) {
      return res.status(400).json({ error: '유효한 이메일 주소를 입력해주세요' });
    }
    
    // 비밀번호 강도 검증
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: '비밀번호가 보안 요구사항을 충족하지 않습니다',
        details: passwordValidation.errors,
      });
    }

    // 이메일 중복 확인
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [sanitizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: '이미 등록된 이메일입니다' });
    }

    // 비밀번호 해싱 (강도 12로 증가)
    const hashedPassword = await bcrypt.hash(password, 12);

    // 사용자 생성
    const result = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [sanitizedEmail, hashedPassword, sanitizedName]
    );

    const user = result.rows[0];
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    
    // Refresh Token DB 저장
    const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30일
    await saveRefreshToken(user.id, refreshToken, refreshExpires);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    
    // 입력 검증
    const sanitizedEmail = sanitizeInput(email?.toLowerCase());
    
    if (!sanitizedEmail || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요' });
    }

    // 사용자 조회 (계정 잠금 상태 포함)
    const result = await pool.query(
      `SELECT *, 
        CASE WHEN locked_until IS NOT NULL AND locked_until > NOW() THEN TRUE ELSE FALSE END as is_locked
       FROM users WHERE email = $1`,
      [sanitizedEmail]
    );
    
    if (result.rows.length === 0) {
      // 사용자가 없어도 동일한 응답 (타이밍 공격 방지)
      await bcrypt.compare(password, '$2a$12$dummy.hash.for.timing.attack.prevention');
      recordLoginFailure(ip, sanitizedEmail);
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }

    const user = result.rows[0];
    
    // 계정 잠금 확인
    if (user.is_locked) {
      const remainingMinutes = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      await recordLoginHistory(user.id, ip, userAgent, false);
      return res.status(423).json({ 
        error: 'ACCOUNT_LOCKED',
        message: `계정이 일시적으로 잠겼습니다. ${remainingMinutes}분 후에 다시 시도해주세요.`,
        retryAfter: remainingMinutes,
      });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // 실패 횟수 증가
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      const maxAttempts = 5;
      
      if (failedAttempts >= maxAttempts) {
        // 계정 잠금 (30분)
        await pool.query(
          `UPDATE users SET failed_login_attempts = $1, locked_until = NOW() + INTERVAL '30 minutes' WHERE id = $2`,
          [failedAttempts, user.id]
        );
        await recordLoginHistory(user.id, ip, userAgent, false);
        return res.status(423).json({
          error: 'ACCOUNT_LOCKED',
          message: '로그인 시도가 너무 많습니다. 30분 후에 다시 시도해주세요.',
          retryAfter: 30,
        });
      } else {
        await pool.query(
          'UPDATE users SET failed_login_attempts = $1 WHERE id = $2',
          [failedAttempts, user.id]
        );
      }
      
      recordLoginFailure(ip, sanitizedEmail);
      await recordLoginHistory(user.id, ip, userAgent, false);
      
      return res.status(401).json({ 
        error: '이메일 또는 비밀번호가 올바르지 않습니다',
        remainingAttempts: maxAttempts - failedAttempts,
      });
    }

    // 로그인 성공 - 실패 횟수 초기화
    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1',
      [user.id]
    );
    clearLoginAttempts(ip, sanitizedEmail);
    await recordLoginHistory(user.id, ip, userAgent, true);

    // 커플이 없으면 자동 생성
    const coupleCheck = await pool.query(
      'SELECT id FROM couples WHERE user1_id = $1 OR user2_id = $1',
      [user.id]
    );

    if (coupleCheck.rows.length === 0) {
      console.log('Creating couple for user:', user.id);
      await pool.query(
        'INSERT INTO couples (user1_id) VALUES ($1)',
        [user.id]
      );
    }

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    
    // Refresh Token DB 저장
    const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await saveRefreshToken(user.id, refreshToken, refreshExpires);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        is_admin: user.is_admin || false,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken) as { id: number };

    // DB에서 토큰 유효성 검증
    const isValid = await validateRefreshToken(decoded.id, refreshToken);
    if (!isValid) {
      return res.status(401).json({ error: '유효하지 않거나 만료된 토큰입니다' });
    }

    // 사용자 조회
    const result = await pool.query('SELECT id, email FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = result.rows[0];
    
    // 기존 토큰 폐기 (Token Rotation)
    await revokeRefreshToken(user.id, refreshToken);
    
    // 새 토큰 발급
    const newAccessToken = generateAccessToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken(user.id);
    
    // 새 Refresh Token 저장
    const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await saveRefreshToken(user.id, newRefreshToken, refreshExpires);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

// 로그아웃 (토큰 폐기)
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user!.id;
    
    if (refreshToken) {
      await revokeRefreshToken(userId, refreshToken);
    }
    
    // 해당 사용자의 모든 토큰 폐기 (선택적)
    // await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [userId]);
    
    res.json({ success: true, message: '로그아웃되었습니다' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, created_at, is_admin FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({ 
      user: {
        ...user,
        is_admin: user.is_admin || false,
      }, 
      coupleId: req.user!.coupleId 
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 비밀번호 변경
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    // 유효성 검사
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호와 새 비밀번호를 입력해주세요',
      });
    }

    // 새 비밀번호 강도 검사
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: '비밀번호는 8자 이상이어야 합니다',
      });
    }

    // 영문, 숫자 포함 검사
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      return res.status(400).json({
        success: false,
        message: '비밀번호는 영문과 숫자를 모두 포함해야 합니다',
      });
    }

    // 현재 비밀번호 확인
    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다',
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '현재 비밀번호가 올바르지 않습니다',
      });
    }

    // 새 비밀번호가 현재와 같은지 확인
    const isSamePassword = await bcrypt.compare(
      newPassword,
      userResult.rows[0].password
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: '새 비밀번호는 현재 비밀번호와 달라야 합니다',
      });
    }

    // 새 비밀번호 해싱
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '비밀번호 변경에 실패했습니다',
    });
  }
};

// 비밀번호 찾기 (이메일 발송)
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // 이메일로 사용자 찾기
    const userResult = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    );

    // 보안상 사용자 존재 여부 노출 안 함
    if (userResult.rows.length === 0) {
      return res.json({
        success: true,
        message: '등록된 이메일이라면 비밀번호 재설정 링크가 발송됩니다',
      });
    }

    const user = userResult.rows[0];

    // 재설정 토큰 생성 (6자리 숫자)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30분

    // 토큰 저장
    await pool.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expires = $2 
       WHERE id = $3`,
      [resetToken, resetExpires, user.id]
    );

    // 이메일 발송 (실제 구현 시 nodemailer 등 사용)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: '등록된 이메일이라면 비밀번호 재설정 링크가 발송됩니다',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: '요청 처리에 실패했습니다',
    });
  }
};

// 비밀번호 재설정
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body;

    // 토큰 및 만료 확인
    const userResult = await pool.query(
      `SELECT id FROM users 
       WHERE email = $1 AND reset_token = $2 AND reset_token_expires > NOW()`,
      [email, token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않거나 만료된 토큰입니다',
      });
    }

    // 비밀번호 강도 검사
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: '비밀번호는 8자 이상이어야 합니다',
      });
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      return res.status(400).json({
        success: false,
        message: '비밀번호는 영문과 숫자를 모두 포함해야 합니다',
      });
    }

    // 새 비밀번호 해싱 및 업데이트
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users 
       SET password = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [passwordHash, userResult.rows[0].id]
    );

    res.json({
      success: true,
      message: '비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: '비밀번호 재설정에 실패했습니다',
    });
  }
};
