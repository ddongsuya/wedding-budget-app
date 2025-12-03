import { Router } from 'express';
import { body } from 'express-validator';
import { 
  register, 
  login, 
  refresh, 
  getMe, 
  changePassword,
  forgotPassword,
  resetPassword 
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    validate,
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate,
  ],
  login
);

router.post('/refresh', [body('refreshToken').notEmpty(), validate], refresh);

router.get('/me', authenticate, getMe);

// 비밀번호 변경 (인증 필요)
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
    validate,
  ],
  changePassword
);

// 비밀번호 찾기 (이메일 발송)
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail(), validate],
  forgotPassword
);

// 비밀번호 재설정
router.post(
  '/reset-password',
  [
    body('email').isEmail().normalizeEmail(),
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
    validate,
  ],
  resetPassword
);

export default router;
