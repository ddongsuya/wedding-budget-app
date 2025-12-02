import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, refresh, getMe } from '../controllers/authController';
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

export default router;
