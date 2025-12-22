import { Router } from 'express';
import { body } from 'express-validator';
import { 
  register, 
  login, 
  refresh, 
  logout,
  getMe, 
  changePassword,
  forgotPassword,
  resetPassword 
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import {
  validate,
  registerValidation,
  loginValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from '../middleware/validation';
import { 
  loginRateLimiter, 
  registerRateLimiter, 
  passwordResetRateLimiter,
  checkLoginBlock 
} from '../middleware/rateLimiter';

const router = Router();

router.post(
  '/register',
  registerRateLimiter, // 회원가입 Rate Limiter 적용
  registerValidation,
  validate,
  register
);

router.post(
  '/login',
  loginRateLimiter, // Rate Limiter 적용
  checkLoginBlock, // 차단 상태 확인
  loginValidation,
  validate,
  login
);

router.post('/refresh', [body('refreshToken').notEmpty().withMessage('리프레시 토큰이 필요합니다')], validate, refresh);

router.post('/logout', authenticate, logout);

router.get('/me', authenticate, getMe);

// 비밀번호 변경 (인증 필요)
router.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  validate,
  changePassword
);

// 비밀번호 찾기 (이메일 발송)
router.post(
  '/forgot-password',
  passwordResetRateLimiter, // 비밀번호 재설정 Rate Limiter 적용
  forgotPasswordValidation,
  validate,
  forgotPassword
);

// 비밀번호 재설정
router.post(
  '/reset-password',
  passwordResetRateLimiter, // 비밀번호 재설정 Rate Limiter 적용
  resetPasswordValidation,
  validate,
  resetPassword
);

export default router;
