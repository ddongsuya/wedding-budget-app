import { Router } from 'express';
import { body } from 'express-validator';
import { createInvite, joinCouple, getCouple } from '../controllers/coupleController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

router.post('/invite', authenticate, createInvite);

router.post(
  '/join',
  authenticate,
  [body('inviteCode').trim().notEmpty(), validate],
  joinCouple
);

router.get('/', authenticate, getCouple);

export default router;
