import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../types';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // 이메일 중복 확인
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const result = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, hashedPassword, name]
    );

    const user = result.rows[0];
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

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

    // 사용자 조회
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

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

    res.json({
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

    // 사용자 조회
    const result = await pool.query('SELECT id, email FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = result.rows[0];
    const newAccessToken = generateAccessToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0], coupleId: req.user!.coupleId });
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
